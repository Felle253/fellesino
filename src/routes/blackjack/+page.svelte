<script lang="ts">
  import { enhance, deserialize } from '$app/forms';

  export let data;
  export let form;

  // ── State ──────────────────────────────────────────────
  let userCoins: number = data.user?.coins ?? 0;
  let currentBet: number = 0;
  let loading = false;
  let error: string | null = null;

  // Game state
  let gameStatus: 'betting' | 'playing' | 'finished' = 'betting';
  let roundId: string | null = null;
  let playerCards: string[] = [];
  let dealerCards: string[] = [];
  let playerScore: number = 0;
  let dealerScore: number = 0;
  let result: string | null = null;
  let payout: number = 0;

  // Restore active round from server on load
  $: if (data.activeRound?.blackjackHand) {
    const hand = data.activeRound.blackjackHand;
    roundId = data.activeRound.id;
    playerCards = hand.playerCards.split(',').map((c: string) => c.trim());
    dealerCards = hand.dealerCards.split(',').map((c: string) => c.trim()).slice(0, 1);
    playerScore = hand.playerScore;
    dealerScore = 0;
    gameStatus = 'playing';
    currentBet = data.activeRound.betAmount;
  }

  // ── Helpers ────────────────────────────────────────────
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

  // ── Actions ────────────────────────────────────────────
  async function handleChipClick(chip: number) {
    const d = await post('addBet', { chip });
    if (!d) return;
    if (d.error) { error = d.error; return; }
    currentBet += chip;
  }

  async function handleDeal() {
    if (currentBet === 0) return;
    const d = await post('deal', { bet: currentBet });
    if (!d) return;
    if (d.error) { error = d.error; return; }
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
    userCoins += d.payout;
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
  }
</script>

<div class="game-container">
	<div class="bg-image"></div>	

	<div class="top-left">
		<a class="close-btn close-btn-link" aria-label="Back" href="/">✕</a>
		<div class="arrow-and-label">
			<div class="rotated-label">Surrender</div>
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
					on:click={gameStatus === 'finished' ? handleNewGame : handleDeal}
					disabled={loading || (gameStatus === 'betting' && currentBet === 0) || gameStatus === 'playing'}
				>
					<span class="btn-label">{gameStatus === 'finished' ? 'NEW GAME' : 'DEAL'}</span>
				</button>

				{#if gameStatus === 'betting'}
					<div class="chips-row">
						<button class="chip chip-5" type="button" on:click={() => handleChipClick(5)} disabled={loading}>
							<span class="chip-value">$5</span>
						</button>
						<button class="chip chip-25" type="button" on:click={() => handleChipClick(25)} disabled={loading}>
							<span class="chip-value">$25</span>
						</button>
						<button class="chip chip-100" type="button" on:click={() => handleChipClick(100)} disabled={loading}>
							<span class="chip-value">$100</span>
						</button>
						<button class="chip chip-500" type="button" on:click={() => handleChipClick(500)} disabled={loading}>
							<span class="chip-value">$500</span>
						</button>
					</div>
				{/if}
			</form>
		</div>
	</div>

	<div class="card-area dealer-area">
		<div class="cards-row">
			{#each dealerCards as card, i (i)}
				{@const { rank, suit } = parseCard(card)}
				<div class="card" class:red={isRedCard(card)}>
					<span class="card-corner tl">{rank}<br />{suit}</span>
					<span class="card-suit-center">{suit}</span>
					<span class="card-corner br">{rank}<br />{suit}</span>
				</div>
			{/each}
			{#if gameStatus === 'playing' && dealerCards.length === 1}
				<div class="card card-hidden">
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
			{#each playerCards as card, i (i)}
				{@const { rank, suit } = parseCard(card)}
				<div class="card" class:red={isRedCard(card)}>
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
				on:click={handleHit}
				disabled={loading}
			>
				<span class="btn-label">HIT</span>
			</button>
			<button
				class="btn btn-circle"
				type="button"
				on:click={handleDouble}
				disabled={loading || playerCards.length !== 2}
			>
				<span class="btn-label">DOUBLE</span>
			</button>
			<button
				class="btn btn-rect"
				type="button"
				on:click={handleStand}
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

<style>
	@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Rajdhani:wght@500;700&display=swap');

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
		z-index: 0;
	}

	/* ── TOP LEFT ── */
	.top-left {
		position: absolute;
		top: 22px;
		left: 22px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.close-btn {
		width: 46px;
		height: 46px;
		border-radius: 50%;
		background: #ff4d4d;
		border: 3px solid #4e2c1c;
		color: #ffffff;
		font-size: 1.3rem;
		font-weight: 900;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.1s,
			box-shadow 0.1s,
			margin-top 0.1s;
	}

	.close-btn-link {
		text-decoration: none;
	}

	.close-btn:hover {
		transform: translateY(2px);
		margin-top: 2px;
	}

	.rotated-label {
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(225deg) translate(10px, 60px);
		color: #ffffff;
		-webkit-text-stroke: 1px #4e2c1c;
		font-size: 1.5rem;
		font-weight: 900;
		margin-bottom: 2px;
	}

	/* ── TOP RIGHT ── */
	.top-right {
		position: absolute;
		top: 22px;
		right: 24px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
	}

	.money-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		background: #0b1a12;
		border: 3px solid #4e2c1c;
		border-radius: 12px;
		padding: 6px 14px 6px 20px;
	}

	.money-label {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #c5a059;
	}

	.money-value {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.3rem;
		font-weight: 900;
		color: #ffffff;
		-webkit-text-stroke: 1px #4e2c1c;
	}

	.money-value.bet {
		color: #00e5ff;
	}

	/* ── BOTTOM RIGHT ── */
	.bottom-right {
		position: absolute;
		bottom: 24px;
		right: 24px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
	}

	.round-status {
		position: relative;
		top: auto;
		left: auto;
		transform: none;
		z-index: auto;
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
		gap: 6px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.chip {
		position: relative;
		width: 55px;
		height: 55px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition:
			transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1),
			filter 0.1s;
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
		inset: 3px;
		border-radius: 50%;
		border: 2px solid rgba(78, 44, 28, 0.3);
		pointer-events: none;
		background: repeating-conic-gradient(
			from 0deg,
			transparent 0deg 6deg,
			rgba(78, 44, 28, 0.1) 6deg 12deg
		);
	}

	.chip-5 {
		background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 50%, #ff6b6b 100%);
	}

	.chip-25 {
		background: linear-gradient(135deg, #4dabf7 0%, #1c7ed6 50%, #4dabf7 100%);
	}

	.chip-100 {
		background: linear-gradient(135deg, #00e5ff 0%, #00bcd4 50%, #00e5ff 100%);
	}

	.chip-500 {
		background: linear-gradient(135deg, #c5a059 0%, #9d7c3e 50%, #c5a059 100%);
	}

	.chip:hover {
		transform: translateY(-6px) scale(1.08);
		filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.3));
	}

	.chip:active:not(:disabled) {
		transform: translateY(4px) scale(0.98);
	}

	.error-message {
		background: #ff4d4d;
		color: #ffffff;
		padding: 8px 16px;
		border-radius: 8px;
		border: 2px solid #4e2c1c;
		font-weight: 700;
		font-size: 0.9rem;
		text-align: center;
		max-width: 200px;
	}

	.result-message {
		background: #0b1a12;
		border: 3px solid #4e2c1c;
		border-radius: 12px;
		padding: 12px 16px;
		text-align: center;
		min-width: 200px;
	}

	.result-message.won {
		background: linear-gradient(135deg, #1ade01 0%, #00a800 100%);
	}

	.result-message.lost {
		background: linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%);
	}

	.result-text {
		font-size: 1.3rem;
		font-weight: 900;
		color: #ffffff;
		-webkit-text-stroke: 1px #4e2c1c;
		margin-bottom: 4px;
	}

	.payout-text {
		font-size: 1.1rem;
		font-weight: 700;
		color: #00e5ff;
		-webkit-text-stroke: 1px #4e2c1c;
	}

	.chip-value {
		font-size: 0.85rem;
		color: #ffffff;
		-webkit-text-stroke: 1.5px #4e2c1c;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
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
		gap: 6px;
	}

	.dealer-area {
		top: 20%;
	}

	.player-area {
		top: 53%;
	}

	.cards-row {
		display: flex;
		gap: -4px;
		align-items: flex-end;
	}

	.card {
		position: relative;
		width: 70px;
		height: 98px;
		border-radius: 9px;
		background: #ffffff;
		border: 3px solid #4e2c1c;
		color: #1c1c1c;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 -4px; /* slight card overlap */
		transition:
			transform 0.1s ease,
			margin-top 0.1s ease;
	}

	.card:hover {
		transform: translate(-5px, -15px) scale(1.05);
		z-index: 2;
	}

	.card.red {
		color: #e53935;
	}

	/* Corner pip */
	.card-corner {
		position: absolute;
		font-size: 0.68rem;
		line-height: 1.15;
		text-align: center;
		font-weight: 900;
		font-family: 'Rajdhani', sans-serif;
	}

	.card-corner.tl {
		top: 5px;
		left: 6px;
	}

	.card-corner.br {
		bottom: 5px;
		right: 6px;
		transform: rotate(180deg);
	}

	.card-suit-center {
		font-size: 2rem;
		line-height: 1;
	}

	/* Face-down card */
	.card-hidden {
		background: #00e5ff;
	}

	.card-back-inner {
		width: 100%;
		height: 100%;
		border-radius: 5px;
		border: 2px solid rgba(11, 26, 18, 0.4);
		background-image: repeating-linear-gradient(
			45deg,
			rgba(11, 26, 18, 0.2) 0px,
			rgba(11, 26, 18, 0.2) 4px,
			transparent 4px,
			transparent 12px
		);
	}

	/* ── SCORE BADGE ── */
	.score-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		border-radius: 12px;
		padding: 5px 16px 5px 12px;
		background: #0b1a12;
		border: 3px solid #4e2c1c;
	}

	.dealer-badge {
		transform: none;
	}

	.player-badge {
		transform: none;
	}

	.score-value {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.3rem;
		font-weight: 900;
		color: #ffffff;
		-webkit-text-stroke: 1px #4e2c1c;
		min-width: 26px;
		text-align: center;
	}

	.score-value.player-val {
		color: #ffffff;
	}

	@keyframes popIn {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* ── BOTTOM BUTTONS ── */
	.action-buttons {
		position: absolute;
		bottom: 5%;
		left: 45%;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 28px;
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
		opacity: 0.6;
		filter: grayscale(0.6);
		cursor: not-allowed;
		transform: none !important;
		box-shadow: 0 0 0 #4e2c1c !important;
		margin-top: 6px;
	}

	.btn-circle,
	.btn-rect,
	.btn-deal {
		border: 4px solid #4e2c1c;
		background: #00e5ff;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.1s,
			box-shadow 0.1s,
			margin-top 0.1s;
	}

	.btn-circle:active:not(:disabled),
	.btn-rect:active:not(:disabled),
	.btn-deal:active:not(:disabled) {
		transform: translateY(6px);
		box-shadow: 0 0 0 #4e2c1c;
		margin-top: 6px;
	}

	.btn-circle {
		width: 110px;
		height: 85px;
		border-radius: 50%;
		transform: rotate(-4deg);
	}

	.btn-rect {
		width: 160px;
		height: 80px;
		border-radius: 20px;
		background: #c5a059;
		transform: rotate(2deg);
	}

	.btn-deal {
		width: 130px;
		height: 50px;
		border-radius: 16px;
		background: #00e5ff;
	}

	.btn-label {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: 0.1em;
		color: #ffffff;
		-webkit-text-stroke: 1.5px #4e2c1c;
		text-shadow: 2px 2px 0 #4e2c1c;
		pointer-events: none;
	}

	/* ── CARD PILE ── */
	.card-pile {
		position: absolute;
		left: 63%;
		top: 45%;
		transform: translateY(-50%);
		z-index: 10;
		width: 130px;
		height: 150px;
	}

	.pile-card {
		position: absolute;
		width: 70px;
		height: 98px;
		border-radius: 9px;
		background: #00e5ff;
		border: 3px solid #4e2c1c;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pile-card-1 {
		left: 0;
		top: 0;
		z-index: 1;
	}
	.pile-card-2 {
		left: 5px;
		top: 4px;
		z-index: 2;
	}
	.pile-card-3 {
		left: 10px;
		top: 8px;
		z-index: 3;
	}
	.pile-card-4 {
		left: 15px;
		top: 12px;
		z-index: 4;
	}
	.pile-card-5 {
		left: 20px;
		top: 16px;
		z-index: 5;
	}
</style>
