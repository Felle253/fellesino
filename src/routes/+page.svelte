<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { fade } from 'svelte/transition';
	import { sidebar } from '$lib/stores/sidebar.svelte';

	type AuthFormState = {
		activeTab?: 'login' | 'register';
		loginError?: string;
		registerError?: string;
	};

	let { form, data }: { form?: AuthFormState; data: any } = $props();

	let showAuthModal = $state(false);
	let activeTab = $state<'login' | 'register'>('login');
	let isSubmitting = $state(false);

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
			goto(base + '/blackjack');
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
	<a href="{base}/" class="logo">Fellesino</a>

	<div class="topbar-right">
		{#if data?.user}
			<button class="coins-indicator" type="button" onclick={() => sidebar.show()}>${data.user.coins}</button>
			<button class="btn-login" type="button" onclick={() => sidebar.show()}>Profile</button>
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
	<p class="section-label">Games</p>
	<div class="game-grid">
		<button type="button" class="game-card blackjack-card" onclick={handleGameCardClick}>
			<div class="card-meta">
				<span class="card-name">Blackjack</span>
				<span class="card-type">Table</span>
			</div>
		</button>

		<a href="{base}/poker" class="game-card">
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

		<a href="{base}/diamond-mine" class="game-card">
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
		transition:fade={{ duration: 150 }}
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="button"
		tabindex="0"
		aria-label="Close authentication dialog"
	>
		<div
			class="auth-modal"
			transition:fly={{ y: 30, duration: 250 }}
			role="dialog"
			aria-modal="true"
			aria-label="Authentication dialog"
		>
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

				{#key activeTab}
				{#if activeTab === 'login'}
					<div in:fly={{ y: 12, duration: 180 }}>
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
						{#if isSubmitting}
							<svg class="spinner" viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="8" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="40" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.7s" repeatCount="indefinite"/></circle></svg>
						{/if}
						{isSubmitting ? 'Logging in...' : 'Login'}
					</button>
				</form>
				</div>
			{:else}
				<div in:fly={{ y: 12, duration: 180 }}>
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
						{#if isSubmitting}
							<svg class="spinner" viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="8" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="40" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="0.7s" repeatCount="indefinite"/></circle></svg>
						{/if}
						{isSubmitting ? 'Creating account...' : 'Create Account'}
					</button>
				</form>
				</div>
			{/if}
			{/key}
			</div>
		</div>
	</div>
{/if}

<style>
	.page-wrap {
		min-height: 100vh;
		background-color: #0a0a0a;
		background-image: url('/images/MainBG.png');
		background-repeat: no-repeat;
		background-position: center;
		background-size: cover;
		background-attachment: fixed;
		color: #888;
	}

	/* ── TOPBAR ── */
	.topbar {
		display: flex;
		align-items: center;
		height: 4rem;
		padding: 0 2rem;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(59, 130, 246, 0.2);
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.logo {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.8rem;
		font-weight: 900;
		color: #fff;
		text-decoration: none;
		letter-spacing: 0.5px;
		text-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
		transition: text-shadow 0.2s;
		white-space: nowrap;
	}
	.logo:hover {
		text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
	}
	.topbar-right {
		display: flex;
		gap: 0.7rem;
		margin-left: auto;
		align-items: center;
	}
	.btn-login {
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		padding: 0.5rem 1.2rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.06);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
		font-family: 'Rajdhani', sans-serif;
	}
	.btn-login:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(59, 130, 246, 0.4);
	}

	.btn-register {
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 700;
		color: #fff;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		padding: 0.5rem 1.3rem;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: box-shadow 0.2s, transform 0.15s;
		font-family: 'Rajdhani', sans-serif;
		box-shadow: 0 2px 12px rgba(59, 130, 246, 0.25);
	}
	.btn-register:hover {
		box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
		transform: translateY(-1px);
	}

	/* ── PAGE ── */
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	/* ── SECTION LABEL ── */
	.section-label {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: #3b82f6;
		margin: 0 0 1.2rem;
	}

	/* ── GAME GRID ── */
	.game-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.game-card {
		background: #151515;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		cursor: pointer;
		font-family: inherit;
		font-size: inherit;
		padding: 0;
		transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
	}
	.game-card:hover {
		transform: translateY(-6px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.1);
		border-color: rgba(59, 130, 246, 0.3);
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
		background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
		border-top: 1px solid rgba(59, 130, 246, 0.15);
		padding: 1.2rem 1rem 0.8rem;
	}

	.card-meta {
		padding: 0.8rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.card-name {
		font-size: 1rem;
		font-weight: 700;
		color: #fff;
	}
	.card-type {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #3b82f6;
	}

	/* ── AUTH MODAL ── */
	.auth-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1200;
		padding: 1.5rem;
	}

	.auth-modal {
		width: min(960px, 100%);
		min-height: 600px;
		display: grid;
		grid-template-columns: 1.05fr 1fr;
		background: #111;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.auth-visual {
		padding: 2.5rem;
		color: #fff;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
	}
	.auth-visual::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%);
		pointer-events: none;
	}
	.auth-visual.login {
		background-image: url('/images/loginside.png');
	}
	.auth-visual.register {
		background-image: url('/images/registerside.png');
	}
	.auth-visual h2 {
		margin: 0;
		font-size: 2.5rem;
		position: relative;
		z-index: 1;
		font-family: 'Casino', cursive;
		color: #fff;
		text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
	}

	.auth-content {
		position: relative;
		padding: 1.8rem 2rem 2rem;
		color: #e0e0e0;
		background: #111;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
		color: #aaa;
		cursor: pointer;
		font-size: 1.3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}
	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.auth-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
	.auth-tabs button {
		padding: 0.6rem 1rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #666;
		font-weight: 700;
		font-size: 0.95rem;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
		font-family: 'Rajdhani', sans-serif;
		margin-bottom: -1px;
	}
	.auth-tabs button.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.auth-content h3 {
		font-size: 2rem;
		line-height: 1.15;
		margin: 0 0 1.5rem;
		color: #fff;
	}

	.auth-form {
		display: grid;
		gap: 1rem;
	}

	.auth-form label {
		display: grid;
		gap: 0.4rem;
		font-size: 0.9rem;
		color: #aaa;
		font-weight: 600;
	}

	.auth-form input {
		height: 52px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.04);
		padding: 0 1rem;
		color: #fff;
		font-size: 1rem;
		font-family: 'Rajdhani', sans-serif;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.auth-form input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
	}
	.auth-form input::placeholder {
		color: #555;
	}

	.auth-error {
		color: #ff4d4d;
		margin: 0;
		font-size: 0.9rem;
		background: rgba(255, 77, 77, 0.08);
		padding: 0.5rem 0.8rem;
		border-radius: 6px;
		border: 1px solid rgba(255, 77, 77, 0.15);
	}

	.auth-submit {
		margin-top: 0.5rem;
		height: 52px;
		border: none;
		border-radius: 10px;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: #fff;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Rajdhani', sans-serif;
		box-shadow: 0 2px 16px rgba(59, 130, 246, 0.2);
		transition: box-shadow 0.2s, transform 0.15s;
	}
	.auth-submit:hover:not(:disabled) {
		box-shadow: 0 4px 24px rgba(59, 130, 246, 0.35);
		transform: translateY(-1px);
	}
	.auth-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		flex-shrink: 0;
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
		font-family: inherit;
		font-size: 1rem;
		font-weight: 700;
		color: #60a5fa;
		padding: 0.4rem 1rem;
		display: flex;
		align-items: center;
		letter-spacing: 0.03em;
		background: rgba(59, 130, 246, 0.06);
		border: 1px solid rgba(59, 130, 246, 0.15);
		border-radius: 8px;
		gap: 0.4rem;
	}
	.coins-indicator::before {
		content: '◆';
		font-size: 0.75rem;
		color: #3b82f6;
	}

	@media (max-width: 600px) {
		.game-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
