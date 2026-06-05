<script lang="ts">
  import { enhance, deserialize } from '$app/forms';
  import { base } from '$app/paths';

  let { data, form } = $props();

  let userCoins = $state<number>(data.user?.coins ?? 0);
  let currentBet = $state(0);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let gameStatus = $state<'betting' | 'playing' | 'finished'>('betting');
  let roundId = $state<string | null>(null);
  let playerCards = $state<string[]>([]);
  let dealerCards = $state<string[]>([]);
  let playerScore = $state(0);
  let dealerScore = $state(0);
  let result = $state<string | null>(null);
  let payout = $state(0);

  $effect(() => {
    if (data.activeRound?.blackjackHand) {
      const hand = data.activeRound.blackjackHand;
      roundId = data.activeRound.id;
      playerCards = hand.playerCards.split(',').map((c: string) => c.trim());
      dealerCards = hand.dealerCards.split(',').map((c: string) => c.trim()).slice(0, 1);
      playerScore = hand.playerScore;
      dealerScore = 0;
      gameStatus = 'playing';
      currentBet = data.activeRound.betAmount;
    }
  });

  function parseCard(card: string) {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    const suitSymbols: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
    return { rank, suit: suitSymbols[suit] ?? suit };
  }

  function isRedCard(card: string) {
    const suit = card.slice(-1);
    return suit === 'H' || suit === 'D';
  }

  async function post(action: string, body: Record<string, string | number>): Promise<any> {
    loading = true;
    error = null;
    const fd = new FormData();
    for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
    const res = await fetch(`?/${action}`, { method: 'POST', body: fd });
    const text = await res.text();
    const result = deserialize(text);
    loading = false;

    if (result.type === 'redirect') {
      window.location.href = result.location;
      return null;
    }
    if (result.type === 'error') {
      error = typeof result.error === 'string' ? result.error : 'An unexpected error occurred.';
      return null;
    }
    return (result.type === 'success' || result.type === 'failure') ? (result.data ?? null) : null;
  }

  async function handleChipClick(chip: number) {
	if (currentBet + chip > userCoins) {
        error = 'You do not have enough coins to place this bet';
        return;
    }

    const d = await post('addBet', { chip, currentBet });
    if (!d) return;
    if (d.error) { error = d.error; return; }
    currentBet += chip;
  }

  async function handleDeal() {
    if (currentBet === 0) return;
    const d = await post('deal', { bet: currentBet });
    if (!d) return;
    if (d.error) { error = d.error; currentBet = 0; return; }
    roundId = d.roundId;
    playerCards = d.playerCards.split(',').map((c: string) => c.trim());
    dealerCards = [d.dealerCards.trim()];
    playerScore = d.playerScore;
    dealerScore = 0;
    userCoins -= currentBet;
    gameStatus = 'playing';
  }

  async function handleHit() {
    const d = await post('hit', { roundId: roundId! });
    if (!d) return;
    if (d.error) { error = d.error; return; }
    playerCards = d.playerCards.split(',').map((c: string) => c.trim());
    playerScore = d.playerScore;
    if (d.bust) {
      result = 'LOST';
      if (d.dealerCards) {
        dealerCards = d.dealerCards.split(',').map((c: string) => c.trim());
        dealerScore = d.dealerScore;
      } else {
        dealerScore = 0;
      }
      payout = 0;
      gameStatus = 'finished';
    }
  }

  async function handleStand() {
    const d = await post('stand', { roundId: roundId! });
    if (!d) return;
    if (d.error) { error = d.error; return; }
    dealerCards = d.dealerCards.split(',').map((c: string) => c.trim());
    dealerScore = d.dealerScore;
    result = d.result;
    payout = d.payout;
    userCoins += d.payout - currentBet;
    gameStatus = 'finished';
  }

  async function handleDouble() {
    const d = await post('double', { roundId: roundId! });
    if (!d) return;
    if (d.error) { error = d.error; return; }
    playerCards = d.playerCards.split(',').map((c: string) => c.trim());
    dealerCards = d.dealerCards.split(',').map((c: string) => c.trim());
    playerScore = d.playerScore;
    dealerScore = d.dealerScore;
    result = d.result;
    payout = d.payout;
    userCoins += d.payout - currentBet; // second bet was already deducted server-side
    gameStatus = 'finished';
  }

  let cardDealId = $state(0);
  let showSurrenderConfirm = $state(false);

  function handleSurrenderClick() {
    if (gameStatus === 'betting') {
      window.location.href = base + '/';
    } else if (gameStatus === 'playing') {
      showSurrenderConfirm = true;
    }
  }

  function cancelSurrender() {
    showSurrenderConfirm = false;
  }

  async function confirmSurrender() {
    showSurrenderConfirm = false;
    const d = await post('surrender', { roundId: roundId! });
    if (!d) return;
    if (d.error) { error = d.error; return; }
    dealerCards = d.dealerCards.split(',').map((c: string) => c.trim());
    dealerScore = d.dealerScore;
    result = 'LOST';
    payout = d.payout;
    userCoins += payout - currentBet;
    gameStatus = 'finished';
  }

  function handleNewGame() {
    currentBet = 0;
    playerCards = [];
    dealerCards = [];
    playerScore = 0;
    dealerScore = 0;
    result = null;
    payout = 0;
    roundId = null;
    error = null;
    gameStatus = 'betting';
    cardDealId++;
  }
</script>

<div class="game-container">
	<div class="bg-image"></div>	

	<div class="top-left">
		<a class="close-btn close-btn-link" aria-label="Back" href="{base}/">✕</a>
		<div class="arrow-and-label">
			<button class="rotated-label" onclick={handleSurrenderClick}>
				{gameStatus === 'betting' ? 'Leave' : 'Surrender'}
			</button>
		</div>
	</div>

	<div class="top-right">
		<div class="money-display">
			<span class="money-label">Total Money</span>
			<span class="money-value">${userCoins}</span>
		</div>
		<div class="money-display">
			<span class="money-label">Total Bet</span>
			<span class="money-value bet">${currentBet}</span>
		</div>
	</div>

	<div class="bottom-right">
		<div class="round-status">
			{#if error}
				<div class="error-message">{error}</div>
			{/if}
			{#if gameStatus === 'finished'}
				<div class="result-message" class:won={result === 'WON' || result === 'BLACKJACK'} class:lost={result === 'LOST'}>
					<div class="result-text">
						{#if result === 'WON'}
							YOU WON!
						{:else if result === 'BLACKJACK'}
							BLACKJACK!
						{:else if result === 'PUSH'}
							PUSH
						{:else}
							YOU LOST
						{/if}
					</div>
					{#if payout > 0}
						<div class="payout-text">+${payout}</div>
					{/if}
				</div>
			{/if}
			<form class="bet-form">
				<button
					class="btn btn-deal"
					type="button"
					onclick={gameStatus === 'finished' ? handleNewGame : handleDeal}
					disabled={loading || (gameStatus === 'betting' && currentBet === 0) || gameStatus === 'playing'}
				>
					<span class="btn-label">{gameStatus === 'finished' ? 'NEW GAME' : 'DEAL'}</span>
				</button>

				{#if gameStatus === 'betting'}
					<div class="chips-row">
						<button class="chip chip-5" type="button" onclick={() => handleChipClick(5)} disabled={loading || currentBet + 5 > userCoins}>
							<span class="chip-value">$5</span>
						</button>
						<button class="chip chip-25" type="button" onclick={() => handleChipClick(25)} disabled={loading || currentBet + 5 > userCoins}>
							<span class="chip-value">$25</span>
						</button>
						<button class="chip chip-100" type="button" onclick={() => handleChipClick(100)} disabled={loading || currentBet + 5 > userCoins}>
							<span class="chip-value">$100</span>
						</button>
						<button class="chip chip-500" type="button" onclick={() => handleChipClick(500)} disabled={loading || currentBet + 5 > userCoins}>
							<span class="chip-value">$500</span>
						</button>
					</div>
				{/if}
			</form>
		</div>
	</div>

	<div class="card-area dealer-area">
		<div class="cards-row">
			{#each dealerCards as card, i (card)}
				{@const { rank, suit } = parseCard(card)}
				<div class="card" class:red={isRedCard(card)} style="--i: {i}; --total: {dealerCards.length}">
					<span class="card-corner tl">{rank}<br />{suit}</span>
					<span class="card-suit-center">{suit}</span>
					<span class="card-corner br">{rank}<br />{suit}</span>
				</div>
			{/each}
			{#if gameStatus === 'playing' && dealerCards.length === 1}
				<div class="card card-hidden" style="--i: 1; --total: 2">
					<div class="card-back-inner"></div>
				</div>
			{/if}
		</div>
		{#if dealerScore > 0 || (gameStatus === 'finished' && result)}
			<div class="score-badge dealer-badge">
				<span class="score-value">{dealerScore}</span>
			</div>
		{/if}
	</div>

	<div class="card-area player-area">
		{#if playerScore > 0}
			<div class="score-badge player-badge">
				<span class="score-value player-val">{playerScore}</span>
			</div>
		{/if}
		<div class="cards-row">
			{#each playerCards as card, i (card)}
				{@const { rank, suit } = parseCard(card)}
				<div class="card" class:red={isRedCard(card)} style="--i: {i}; --total: {playerCards.length}">
					<span class="card-corner tl">{rank}<br />{suit}</span>
					<span class="card-suit-center">{suit}</span>
					<span class="card-corner br">{rank}<br />{suit}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Bottom Buttons -->
	<div class="action-buttons">
		{#if gameStatus === 'playing'}
			<button
				class="btn btn-circle"
				type="button"
				onclick={handleHit}
				disabled={loading}
			>
				<span class="btn-label">HIT</span>
			</button>
			<button
				class="btn btn-circle"
				type="button"
				onclick={handleDouble}
				disabled={loading || playerCards.length !== 2}
			>
				<span class="btn-label">DOUBLE</span>
			</button>
			<button
				class="btn btn-rect"
				type="button"
				onclick={handleStand}
				disabled={loading}
			>
				<span class="btn-label">STAND</span>
			</button>
		{/if}
	</div>

	<div class="card-pile">
		<div class="pile-card pile-card-1"><div class="card-back-inner"></div></div>
		<div class="pile-card pile-card-2"><div class="card-back-inner"></div></div>
		<div class="pile-card pile-card-3"><div class="card-back-inner"></div></div>
		<div class="pile-card pile-card-4"><div class="card-back-inner"></div></div>
		<div class="pile-card pile-card-5"><div class="card-back-inner"></div></div>
	</div>
</div>

{#if showSurrenderConfirm}
	<div
		class="confirm-backdrop"
		onclick={cancelSurrender}
		onkeydown={(e) => e.key === 'Escape' && cancelSurrender()}
		role="button"
		tabindex="0"
	>
		<div class="confirm-modal" role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && cancelSurrender()} onclick={(e) => e.stopPropagation()}>
			<h3>Surrender?</h3>
			<p>Forfeit this hand? You'll get 50% of your bet back.</p>
			<div class="confirm-actions">
				<button class="confirm-cancel" onclick={cancelSurrender}>Cancel</button>
				<button class="confirm-yes" onclick={confirmSurrender} disabled={loading}>
					{loading ? 'Sending...' : 'Yes, surrender'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.game-container {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		font-family: 'Rajdhani', sans-serif;
		user-select: none;
	}

	.bg-image {
		position: absolute;
		inset: 0;
		background-image: url('/images/BlackJ.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-attachment: fixed;
		background-color: #0d2818;
		z-index: 0;
	}
	.bg-image::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%);
		pointer-events: none;
	}

	/* ── TOP LEFT ── */
	.top-left {
		position: absolute;
		top: 1.8rem;
		left: 1.8rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.close-btn {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(255, 77, 77, 0.85);
		border: 2px solid rgba(255, 255, 255, 0.1);
		color: #ffffff;
		font-size: 1.5rem;
		font-weight: 900;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s, box-shadow 0.15s;
		text-decoration: none;
		box-shadow: 0 2px 12px rgba(255, 77, 77, 0.2);
	}
	.close-btn:hover {
		transform: scale(1.08);
		box-shadow: 0 4px 20px rgba(255, 77, 77, 0.35);
	}

	/* ── TOP RIGHT ── */
	.top-right {
		position: absolute;
		top: 1.8rem;
		right: 1.8rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.money-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(59, 130, 246, 0.15);
		border-radius: 12px;
		padding: 0.5rem 1.2rem 0.5rem 1.8rem;
		backdrop-filter: blur(8px);
	}

	.money-label {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #60a5fa;
	}

	.money-value {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.6rem;
		font-weight: 900;
		color: #ffffff;
		line-height: 1.1;
	}

	.money-value.bet {
		color: #00e5ff;
	}

	/* ── BOTTOM RIGHT ── */
	.bottom-right {
		position: absolute;
		bottom: 2rem;
		right: 2rem;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.round-status {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.bet-form {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-direction: column;
	}

	.chips-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.chip {
		position: relative;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.1s;
		font-family: 'Rajdhani', sans-serif;
		font-weight: 900;
		border: none;
	}
	.chip::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4), transparent 50%);
		pointer-events: none;
	}
	.chip::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: 50%;
		border: 2px solid rgba(0, 0, 0, 0.15);
		pointer-events: none;
		background: repeating-conic-gradient(from 0deg, transparent 0deg 6deg, rgba(0,0,0,0.08) 6deg 12deg);
	}

	.chip-5 { background: linear-gradient(135deg, #ff6b6b 0%, #e53935 100%); }
	.chip-25 { background: linear-gradient(135deg, #4dabf7 0%, #1976d2 100%); }
	.chip-100 { background: linear-gradient(135deg, #00e5ff 0%, #0097a7 100%); }
	.chip-500 { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); }

	.chip:hover:not(:disabled) { transform: translateY(-8px) scale(1.1); filter: drop-shadow(0 4px 16px rgba(0,0,0,0.4)); }
	.chip:active:not(:disabled) { transform: scale(0.92); transition: transform 0.06s; }
	.chip:disabled {
		opacity: 0.35;
		filter: grayscale(0.8);
		cursor: not-allowed;
		transform: none !important;
	}

	.error-message {
		background: rgba(255, 77, 77, 0.9);
		color: #ffffff;
		padding: 10px 20px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-weight: 700;
		font-size: 1rem;
		text-align: center;
		max-width: 260px;
		animation: resultPopIn 0.25s ease-out;
	}

	.result-message {
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 1rem 1.6rem;
		text-align: center;
		min-width: 240px;
		backdrop-filter: blur(8px);
		animation: resultPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.result-message.won {
		border-color: rgba(26, 222, 1, 0.3);
		box-shadow: 0 0 30px rgba(26, 222, 1, 0.15);
	}
	.result-message.lost {
		border-color: rgba(255, 77, 77, 0.3);
		box-shadow: 0 0 30px rgba(255, 77, 77, 0.15);
	}

	.result-text {
		font-size: 1.8rem;
		font-weight: 900;
		color: #ffffff;
		margin-bottom: 4px;
		line-height: 1.1;
	}
	.payout-text {
		font-size: 1.3rem;
		font-weight: 700;
		color: #00e5ff;
	}

	.chip-value {
		font-size: 0.95rem;
		color: #ffffff;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
		pointer-events: none;
		position: relative;
		z-index: 2;
		font-weight: 900;
		letter-spacing: 0.05em;
	}

	/* ── CARD AREAS ── */
	.card-area {
		position: absolute;
		left: 45%;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	.dealer-area { top: 18%; }
	.player-area { top: 52%; }

	.cards-row {
		display: flex;
		gap: -6px;
		align-items: flex-end;
	}

	.card {
		position: relative;
		width: 110px;
		height: 154px;
		border-radius: 12px;
		background: #ffffff;
		border: 2px solid rgba(255, 255, 255, 0.15);
		color: #1c1c1c;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 -6px;
		transition: transform 0.15s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
	.card:hover {
		transform: translate(-8px, -20px) scale(1.06);
		z-index: 2;
	}
	.card.red { color: #e53935; }

	.card-corner {
		position: absolute;
		font-size: 1rem;
		line-height: 1.15;
		text-align: center;
		font-weight: 900;
		font-family: 'Rajdhani', sans-serif;
	}
	.card-corner.tl { top: 8px; left: 8px; }
	.card-corner.br { bottom: 8px; right: 8px; transform: rotate(180deg); }

	.card-suit-center { font-size: 3rem; line-height: 1; }

	/* Face-down card */
	.card-hidden {
		background: linear-gradient(135deg, #1a2744 0%, #2a3f6e 100%);
		border-color: rgba(59, 130, 246, 0.2);
	}
	.card-back-inner {
		width: 100%;
		height: 100%;
		border-radius: 8px;
		border: 2px solid rgba(59, 130, 246, 0.12);
		background-image:
			repeating-linear-gradient(45deg, rgba(59,130,246,0.06) 0px, rgba(59,130,246,0.06) 4px, transparent 4px, transparent 12px),
			radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 60%);
	}

	/* ── SCORE BADGE ── */
	.score-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		border-radius: 14px;
		padding: 8px 20px 8px 16px;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(59, 130, 246, 0.15);
		backdrop-filter: blur(8px);
		animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.score-value {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.6rem;
		font-weight: 900;
		color: #ffffff;
		min-width: 30px;
		text-align: center;
		line-height: 1;
	}

	@keyframes popIn {
		from { transform: scale(0.5); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	@keyframes resultPopIn {
		from { transform: scale(0.5); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	@keyframes badgePop {
		from { transform: scale(0.6); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	/* ── BOTTOM BUTTONS ── */
	.action-buttons {
		position: absolute;
		bottom: 6%;
		left: 45%;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.btn {
		position: relative;
		cursor: pointer;
		border: none;
		background: transparent;
		padding: 0;
		outline: none;
	}
	.btn:disabled {
		opacity: 0.4;
		filter: grayscale(0.7);
		cursor: not-allowed;
		transform: none !important;
		box-shadow: none !important;
	}

	.btn-circle, .btn-rect, .btn-deal {
		border: 2px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.12s, box-shadow 0.12s;
	}

	.btn-circle:active:not(:disabled),
	.btn-rect:active:not(:disabled) {
		transform: translateY(4px) scale(0.96);
	}

	.btn-circle {
		width: 140px;
		height: 110px;
		border-radius: 50%;
	}
	.btn-circle:first-child {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
	}
	.btn-circle:first-child:hover:not(:disabled) {
		box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4);
		transform: translateY(-2px) scale(1.04);
	}
	.btn-circle:nth-child(2) {
		background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
		box-shadow: 0 4px 20px rgba(96, 165, 250, 0.2);
	}
	.btn-circle:nth-child(2):hover:not(:disabled) {
		box-shadow: 0 6px 30px rgba(96, 165, 250, 0.35);
		transform: translateY(-2px) scale(1.04);
	}
	.btn-rect {
		width: 200px;
		height: 100px;
		border-radius: 24px;
		background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
		box-shadow: 0 4px 20px rgba(29, 78, 216, 0.2);
	}
	.btn-rect:hover:not(:disabled) {
		box-shadow: 0 6px 30px rgba(29, 78, 216, 0.35);
		transform: translateY(-2px) scale(1.04);
	}
	.btn-circle:first-child:hover:not(:disabled) {
		box-shadow: 0 6px 30px rgba(26, 222, 1, 0.4);
		transform: translateY(-2px) scale(1.04);
	}
	.btn-circle:nth-child(2) {
		background: linear-gradient(135deg, #00e5ff 0%, #0097a7 100%);
		box-shadow: 0 4px 20px rgba(0, 229, 255, 0.2);
	}
	.btn-circle:nth-child(2):hover:not(:disabled) {
		box-shadow: 0 6px 30px rgba(0, 229, 255, 0.35);
		transform: translateY(-2px) scale(1.04);
	}

	.btn-rect {
		width: 200px;
		height: 100px;
		border-radius: 24px;
		background: linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%);
		box-shadow: 0 4px 20px rgba(255, 77, 77, 0.2);
	}
	.btn-rect:hover:not(:disabled) {
		box-shadow: 0 6px 30px rgba(255, 77, 77, 0.35);
		transform: translateY(-2px) scale(1.04);
	}

	.btn-deal {
		width: 200px;
		height: 70px;
		border-radius: 24px;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
		transition: transform 0.12s, box-shadow 0.12s;
	}
	.btn-deal:hover:not(:disabled) {
		transform: translateY(-3px) scale(1.04);
		box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4);
	}
	.btn-deal:active:not(:disabled) {
		transform: translateY(4px) scale(0.96);
	}

	.btn-label {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.6rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		color: #ffffff;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		pointer-events: none;
	}

	/* ── CARD PILE ── */
	.card-pile {
		position: absolute;
		left: 65%;
		top: 45%;
		transform: translateY(-50%);
		z-index: 10;
		width: 180px;
		height: 200px;
	}

	.pile-card {
		position: absolute;
		width: 110px;
		height: 154px;
		border-radius: 12px;
		background: linear-gradient(135deg, #1a2744 0%, #2a3f6e 100%);
		border: 2px solid rgba(59, 130, 246, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.pile-card-1 { left: 0; top: 0; z-index: 1; }
	.pile-card-2 { left: 8px; top: 6px; z-index: 2; }
	.pile-card-3 { left: 16px; top: 12px; z-index: 3; }
	.pile-card-4 { left: 24px; top: 18px; z-index: 4; }
	.pile-card-5 { left: 32px; top: 24px; z-index: 5; }

	/* ── CARD DEAL ANIMATION ── */
	@keyframes dealCard {
		from {
			transform: translate(100px, -60px) scale(0.5) rotate(-12deg);
			opacity: 0;
		}
		to {
			transform: translate(0, 0) scale(1) rotate(0deg);
			opacity: 1;
		}
	}
	.card-area .card {
		animation: dealCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		animation-delay: calc(var(--i) * 80ms + 40ms);
	}
	.card-hidden { animation: none; }

	/* ── REVEAL FLIP ── */
	@keyframes flipReveal {
		from { transform: rotateY(90deg) scale(0.8); opacity: 0; }
		to { transform: rotateY(0deg) scale(1); opacity: 1; }
	}
	.game-container:has(.result-message) .dealer-area .card:nth-child(2) {
		animation: flipReveal 0.45s ease-out both;
		animation-delay: 0.1s;
	}

	/* ── SURRENDER / LEAVE BUTTON ── */
	.rotated-label {
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(225deg) translate(10px, 80px);
		color: #60a5fa;
		font-size: 1.4rem;
		font-weight: 900;
		margin-bottom: 2px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: 'Rajdhani', sans-serif;
		line-height: 1;
		transition: color 0.15s, text-shadow 0.15s;
		letter-spacing: 0.05em;
	}
	.rotated-label:hover {
		color: #fff;
		text-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
	}

	/* ── CONFIRMATION MODAL ── */
	.confirm-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1200;
		animation: fadeIn 0.15s ease-out;
	}
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

	.confirm-modal {
		background: #151515;
		border: 1px solid rgba(59, 130, 246, 0.15);
		border-radius: 16px;
		padding: 2rem 2.2rem;
		max-width: 400px;
		width: 90%;
		text-align: center;
		animation: resultPopIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.confirm-modal h3 {
		margin: 0 0 0.6rem;
		font-size: 1.8rem;
		color: #60a5fa;
		font-weight: 900;
	}
	.confirm-modal p {
		margin: 0 0 1.5rem;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.5);
		line-height: 1.4;
	}

	.confirm-actions { display: flex; gap: 0.8rem; justify-content: center; }
	.confirm-cancel {
		padding: 0.7rem 1.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: transparent;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		font-family: 'Rajdhani', sans-serif;
		transition: background 0.15s, color 0.15s;
	}
	.confirm-cancel:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }

	.confirm-yes {
		padding: 0.7rem 1.6rem;
		border-radius: 10px;
		border: none;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: #fff;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		font-family: 'Rajdhani', sans-serif;
		box-shadow: 0 2px 12px rgba(59, 130, 246, 0.2);
		transition: box-shadow 0.15s;
	}
	.confirm-yes:hover:not(:disabled) { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35); }
	.confirm-yes:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
