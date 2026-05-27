<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';

	type AuthFormState = {
		activeTab?: 'login' | 'register';
		loginError?: string;
		registerError?: string;
	};

	let { form, data }: { form?: AuthFormState; data: any } = $props();

	let showAuthModal = $state(false);
	let activeTab = $state<'login' | 'register'>('login');
	let isSubmitting = $state(false);

	let nowTicker = $state(Date.now());
	
	$effect(() => {
		const interval = setInterval(() => {
			nowTicker = Date.now();
		}, 10000);
		return () => clearInterval(interval);
	});

	const canClaim = $derived.by(() => {
		if (!data?.user) return false;
		if (!data.user.lastClaimed) return true;
		const lastClaimedTime = new Date(data.user.lastClaimed).getTime();
		return nowTicker - lastClaimedTime >= 24 * 60 * 60 * 1000;
	});

	const timeRemainingStr = $derived.by(() => {
		if (!data?.user || !data.user.lastClaimed) return '';
		const lastClaimedTime = new Date(data.user.lastClaimed).getTime();
		const diff = 24 * 60 * 60 * 1000 - (nowTicker - lastClaimedTime);
		if (diff <= 0) return '';
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		return `${hours}h ${minutes}m`;
	});

	function openAuthModal(tab: 'login' | 'register') {
		activeTab = tab;
		showAuthModal = true;
	}

	function closeAuthModal() {
		showAuthModal = false;
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && showAuthModal) {
			closeAuthModal();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeAuthModal();
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
			closeAuthModal();
		}
	}

	function handleGameCardClick(event: MouseEvent) {
		event.preventDefault();
		if (data?.user) {
			goto('/blackjack');
		} else {
			openAuthModal('login');
		}
	}

	$effect(() => {
		if (form?.activeTab === 'login' || form?.activeTab === 'register') {
			activeTab = form.activeTab;
			showAuthModal = true;
		}
	});
</script>

<svelte:window onkeydown={handleEscape} />

<div class="page-wrap">

<nav class="topbar">
	<a href="/" class="logo">Fellesino</a>

	<div class="topbar-right">
		{#if data?.user}
			<span class="coins-indicator">${data.user.coins}</span>
			<a href="/profilepage" class="btn-login">Profile</a>
			<form method="POST" action="?/logout" style="display: contents;">
				<button type="submit" class="btn-register">Logout</button>
			</form>
		{:else}
			<button class="btn-login" type="button" onclick={() => openAuthModal('login')}>Sign in</button
			>
			<button class="btn-register" type="button" onclick={() => openAuthModal('register')}>
				Register
			</button>
		{/if}
	</div>
</nav>

<main class="page">
	{#if data?.user}
		<div class="daily-claim-banner">
			<div class="claim-left">
				<span class="claim-eyebrow">Daily Bonus</span>
				<span class="claim-amount">$250</span>
			</div>
			<div class="claim-right">
				{#if canClaim}
					<form
						method="POST"
						action="?/claimDaily"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidateAll();
								}
							};
						}}
					>
						<button type="submit" class="btn-claim">Claim</button>
					</form>
				{:else}
					<span class="claim-countdown">{timeRemainingStr}</span>
				{/if}
			</div>
		</div>
	{/if}

	<p class="section-label">Games</p>
	<div class="game-grid">
		<button type="button" class="game-card blackjack-card" onclick={handleGameCardClick}>
			<div class="card-meta">
				<span class="card-name">Blackjack</span>
				<span class="card-type">Table</span>
			</div>
		</button>

		<a href="/poker" class="game-card">
			<div class="card-thumb poker-thumb">
				<svg class="thumb-art" viewBox="0 0 120 90" fill="none">
					<rect
						x="8"
						y="18"
						width="34"
						height="48"
						rx="5"
						fill="#fff"
						stroke="#ccc"
						stroke-width="1.5"
						transform="rotate(-8 8 18)"
					/>
					<rect
						x="44"
						y="12"
						width="34"
						height="48"
						rx="5"
						fill="#f0f0f0"
						stroke="#ccc"
						stroke-width="1.5"
					/>
					<rect
						x="78"
						y="18"
						width="34"
						height="48"
						rx="5"
						fill="#fff"
						stroke="#ccc"
						stroke-width="1.5"
						transform="rotate(8 78 18)"
					/>
					<text x="50" y="34" font-size="10" fill="#111" font-family="monospace">♥</text>
					<text x="50" y="50" font-size="10" fill="#111" font-family="monospace">♦</text>
					<text x="18" y="42" font-size="10" fill="#aaa" font-family="monospace">♠</text>
					<text x="86" y="42" font-size="10" fill="#aaa" font-family="monospace">♣</text>
				</svg>
			</div>
			<div class="card-meta">
				<span class="card-name">Poker</span>
				<span class="card-type">Table</span>
			</div>
		</a>

		<a href="/diamond-mine" class="game-card">
			<div class="card-thumb mine-thumb">
				<svg class="thumb-art" viewBox="0 0 120 90" fill="none">
					<!-- row 1 -->
					<rect
						x="10"
						y="10"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="35"
						y="10"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="60"
						y="10"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="85"
						y="10"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<!-- row 2 -->
					<rect
						x="10"
						y="35"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="35"
						y="35"
						width="20"
						height="20"
						rx="3"
						fill="#fff"
						stroke="#999"
						stroke-width="1.5"
					/>
					<polygon points="45,37 53,45 45,53 37,45" fill="#222" opacity="0.85" />
					<rect
						x="60"
						y="35"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="85"
						y="35"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<!-- row 3 -->
					<rect
						x="10"
						y="60"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="35"
						y="60"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="60"
						y="60"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
					<rect
						x="85"
						y="60"
						width="20"
						height="20"
						rx="3"
						fill="#e8e8e8"
						stroke="#ccc"
						stroke-width="1"
					/>
				</svg>
			</div>
			<div class="card-meta">
				<span class="card-name">The Mine</span>
				<span class="card-type">Original</span>
			</div>
		</a>
	</div>
</main>

</div>

{#if showAuthModal}
	<div
		class="auth-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="button"
		tabindex="0"
		aria-label="Close authentication dialog"
	>
		<div class="auth-modal" role="dialog" aria-modal="true" aria-label="Authentication dialog">
			<div
				class="auth-visual"
				class:login={activeTab === 'login'}
				class:register={activeTab === 'register'}
			>
				<h2>Fellesino</h2>
			</div>

			<div class="auth-content">
				<button class="close-btn" type="button" onclick={closeAuthModal} aria-label="Close"
					>×</button
				>

				<div class="auth-tabs">
					<button
						type="button"
						class:active={activeTab === 'login'}
						onclick={() => (activeTab = 'login')}
					>
						Login
					</button>
					<button
						type="button"
						class:active={activeTab === 'register'}
						onclick={() => (activeTab = 'register')}
					>
						Register
					</button>
				</div>

				{#if activeTab === 'login'}
					<h3>Welcome back</h3>
				<form
					method="POST"
					action="?/login"
					class="auth-form"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								await invalidateAll();
								closeAuthModal();
							}
						};
					}}
				>
					<label>
						Username or Email
						<input type="text" name="identifier" required disabled={isSubmitting} />
					</label>
					<label>
						Password
						<input type="password" name="password" required disabled={isSubmitting} />
					</label>

					{#if form?.loginError}
						<p class="auth-error">{form.loginError}</p>
					{/if}

					<button type="submit" class="auth-submit" disabled={isSubmitting}>
						{isSubmitting ? 'Logging in...' : 'Login'}
					</button>
				</form>
			{:else}
				<h3>Create an account</h3>
				<form
					method="POST"
					action="?/register"
					class="auth-form"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								await invalidateAll();
								closeAuthModal();
							}
						};
					}}
				>
					<label>
						Username
						<input type="text" name="username" required minlength="3" disabled={isSubmitting} />
					</label>
					<label>
						Email Address
						<input type="email" name="email" disabled={isSubmitting} />
					</label>
					<label>
						Password
						<input type="password" name="password" required minlength="8" disabled={isSubmitting} />
					</label>

					{#if form?.registerError}
						<p class="auth-error">{form.registerError}</p>
					{/if}

					<button type="submit" class="auth-submit" disabled={isSubmitting}>
						{isSubmitting ? 'Creating account...' : 'Create Account'}
					</button>
				</form>
			{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.page-wrap {
		min-height: 100vh;
		background-color: #1a1a1a;
		background-image: url('/images/MainBG.png');
		background-repeat: no-repeat;
		background-position: center;
		background-size: cover;
		background-attachment: fixed;
		color: #666;
	}

	.topbar {
		display: flex;
		align-items: center;
		height: 60px;
		padding: 0 1.5rem;
		background: rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		gap: 2rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.logo {
		font-family: 'Casino', cursive;
		font-size: 1.35rem;
		color: #fff;
		text-decoration: none;
		letter-spacing: 0.5px;
		flex-shrink: 0;
	}
	.topbar-right {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}
	.btn-login {
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 600;
		color: #fff;
		padding: 0.42rem 1rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
	}

	.btn-register {
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 700;
		color: #fff;
		background: rgba(0, 0, 0, 0.3);
		padding: 0.44rem 1.1rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
	}

	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.75rem 1.25rem 3rem;
	}
	.section-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #bbb;
		margin: 0 0 0.9rem;
	}

	.game-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}
	.game-card {
		background: #fff;
		border: 1px solid #000000;
		border-radius: 10px;
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		padding: 0;
	}

	.game-card:hover {
		transform: scale(1.02);
		transition: transform 0.2s ease;
	}

	.blackjack-card {
		position: relative;
		background-image: url('/images/BlackJackIcon.png');
		background-size: cover;
		background-position: center;
		overflow: hidden;
		aspect-ratio: 4/3;
	}

	.blackjack-card .card-meta {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.card-meta {
		padding: 0.65rem 0.8rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid #e5e5e5;
	}
	.card-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #ffffff;
	}
	.card-type {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #bbb;
	}

	.auth-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.62);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1200;
		padding: 1rem;
	}

	.auth-modal {
		width: min(900px, 100%);
		min-height: 520px;
		display: grid;
		grid-template-columns: 1.05fr 1fr;
		background: #fff;
		border-radius: 14px;
		overflow: hidden;
	}

	.auth-visual {
		padding: 2rem;
		color: #fff;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.auth-visual.login {
		background-image: url('/images/loginside.png');
	}

	.auth-visual.register {
		background-image: url('/images/registerside.png');
	}

	.auth-visual h2 {
		margin: 0;
		font-size: 2rem;
	}

	.auth-visual p {
		margin: 0.75rem 0 0;
		line-height: 1.45;
		max-width: 24ch;
	}

	.auth-content {
		position: relative;
		padding: 1.35rem 1.6rem 1.6rem;
		color: #333;
		background: #fff;
	}

	.close-btn {
		position: absolute;
		top: 0.85rem;
		right: 0.9rem;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 1px solid #ddd;
		background: transparent;
		color: #333;
		cursor: pointer;
		font-size: 1.2rem;
	}

	.auth-tabs {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}

	.auth-tabs button {
		padding: 0.5rem 0.95rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #666;
		font-weight: 700;
		cursor: pointer;
	}

	.auth-tabs button.active {
		color: #000;
		border-bottom-color: #000;
	}

	.auth-content h3 {
		font-size: 1.8rem;
		line-height: 1.15;
		margin: 0 0 1.2rem;
	}

	.auth-form {
		display: grid;
		gap: 0.8rem;
	}

	.auth-form label {
		display: grid;
		gap: 0.45rem;
		font-size: 0.95rem;
		color: #333;
		font-weight: 600;
	}

	.auth-form input {
		height: 44px;
		border-radius: 8px;
		border: 1px solid #ddd;
		background: #f9f9f9;
		padding: 0 0.75rem;
		color: #333;
		font-size: 0.95rem;
	}

	.auth-form input:focus {
		outline: none;
		border-color: #000;
	}

	.auth-error {
		color: #d32f2f;
		margin: 0;
		font-size: 0.88rem;
	}

	.auth-submit {
		margin-top: 0.3rem;
		height: 48px;
		border: none;
		border-radius: 8px;
		background: #000;
		color: #fff;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
	}

	@media (max-width: 860px) {
		.auth-modal {
			grid-template-columns: 1fr;
			min-height: auto;
		}

		.auth-visual {
			display: none;
		}
	}

	/* ── COINS INDICATOR ── */
	.coins-indicator {
		font-size: 0.88rem;
		font-weight: 700;
		color: #c5a059;
		padding: 0.38rem 0.8rem;
		display: flex;
		align-items: center;
		letter-spacing: 0.03em;
	}

	/* ── DAILY CLAIM ── */
	.daily-claim-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding-bottom: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.claim-left {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.claim-eyebrow {
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #888;
	}

	.claim-amount {
		font-size: 1.1rem;
		font-weight: 700;
		color: #c5a059;
	}

	.btn-claim {
		font-size: 0.82rem;
		font-weight: 700;
		color: #fff;
		background: rgba(197, 160, 89, 0.2);
		border: 1px solid rgba(197, 160, 89, 0.5);
		border-radius: 6px;
		padding: 0.4rem 1rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
		letter-spacing: 0.03em;
	}

	.btn-claim:hover {
		background: rgba(197, 160, 89, 0.35);
		border-color: rgba(197, 160, 89, 0.8);
	}

	.claim-countdown {
		font-size: 0.82rem;
		font-weight: 600;
		color: #555;
		letter-spacing: 0.02em;
	}

	@media (max-width: 600px) {
		.daily-claim-banner {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>
