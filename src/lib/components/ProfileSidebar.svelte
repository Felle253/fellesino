<script lang="ts">
	import { sidebar } from '$lib/stores/sidebar.svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { fade } from 'svelte/transition';

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) sidebar.hide();
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') sidebar.hide();
	}

	let user = $derived($page.data?.user);

	let nowTicker = $state(Date.now());

	$effect(() => {
		const interval = setInterval(() => {
			nowTicker = Date.now();
		}, 10000);
		return () => clearInterval(interval);
	});

	const canClaim = $derived.by(() => {
		if (!user) return false;
		if (!user.lastClaimed) return true;
		const lastClaimedTime = new Date(user.lastClaimed).getTime();
		return nowTicker - lastClaimedTime >= 24 * 60 * 60 * 1000;
	});

	const timeRemainingStr = $derived.by(() => {
		if (!user || !user.lastClaimed) return '';
		const lastClaimedTime = new Date(user.lastClaimed).getTime();
		const diff = 24 * 60 * 60 * 1000 - (nowTicker - lastClaimedTime);
		if (diff <= 0) return '';
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		return `${hours}h ${minutes}m`;
	});

	function formatDate(date: string | Date | null) {
		if (!date) return 'Unknown';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function handleLogout() {
		await fetch('/api/logout', { method: 'POST' });
		await invalidateAll();
		sidebar.hide();
	}
</script>

<svelte:window onkeydown={handleEscape} />

{#if sidebar.open}
	<div class="backdrop" transition:fade={{ duration: 150 }} onclick={handleBackdrop} role="presentation">
		<div
			class="sidebar"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="Profile"
			tabindex="-1"
		>
			<div class="sidebar-inner">
				<button class="close-btn" onclick={() => sidebar.hide()} aria-label="Close">&times;</button>

				<div class="sidebar-header">
					<span class="brand">Fellesino</span>
				</div>

				{#if user}
					<div class="sidebar-body">
						<div class="avatar-section">
							<div class="avatar">{user.username?.charAt(0).toUpperCase() || '?'}</div>
							<h3 class="username">{user.username}</h3>
						</div>

						<div class="claim-card">
							<div class="claim-icon">
								<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="8" width="18" height="12" rx="2" />
									<path d="M12 2v6" />
									<path d="M8 8c0-2 1.8-4 4-4s4 2 4 4" />
									<path d="M3 14h18" />
								</svg>
							</div>
							<div class="claim-info">
								<span class="claim-label">Daily Bonus</span>
								<span class="claim-amount">$250</span>
							</div>
							<div class="claim-action">
								{#if canClaim}
									<button
										type="button"
										class="btn-claim"
										onclick={async () => {
											const res = await fetch('/api/claim-daily', { method: 'POST' });
											if (res.ok) {
												await invalidateAll();
											}
										}}
									>
										Claim
									</button>
								{:else}
									<span class="claim-countdown">{timeRemainingStr}</span>
								{/if}
							</div>
						</div>

						<div class="stats-grid">
							<div class="stat-item">
								<span class="stat-label">Coins</span>
								<span class="stat-value accent">${user.coins}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Email</span>
								<span class="stat-value">{user.email || '—'}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Joined</span>
								<span class="stat-value">{formatDate(user.createdAt)}</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Last Active</span>
								<span class="stat-value">{formatDate(user.lastActive)}</span>
							</div>
						</div>

						<button class="logout-btn" onclick={handleLogout}>Logout</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 2000;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: flex-end;
	}

	.sidebar {
		width: 420px;
		max-width: 100vw;
		height: 100vh;
		position: relative;
		animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		overflow-y: auto;
	}

	.sidebar-inner {
		min-height: 100vh;
		background:
			linear-gradient(rgba(10,10,10,0.92), rgba(15,15,20,0.96)),
			url('/images/MainBG.png') center/cover no-repeat;
		border-left: 1px solid rgba(59, 130, 246, 0.12);
		box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		padding-bottom: 2rem;
	}

	@keyframes slideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1.2rem;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.25);
		font-size: 1.8rem;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		transition: color 0.15s;
		z-index: 3;
	}
	.close-btn:hover { color: #fff; }

	.sidebar-header {
		padding: 1.2rem 2rem;
		border-bottom: 1px solid rgba(59, 130, 246, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.brand {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.3rem;
		font-weight: 900;
		color: #fff;
		letter-spacing: 1px;
		text-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
	}

	.sidebar-body {
		padding: 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
	}

	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
	}
	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.8rem;
		font-weight: 800;
		color: #fff;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15), 0 4px 20px rgba(59, 130, 246, 0.2);
	}
	.username {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 700;
		color: #fff;
	}

	.claim-card {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02));
		border: 1px solid rgba(59, 130, 246, 0.1);
		border-radius: 12px;
		padding: 0.9rem 1rem;
	}
	.claim-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: rgba(59, 130, 246, 0.08);
		flex-shrink: 0;
	}
	.claim-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.claim-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.claim-amount {
		font-size: 1.1rem;
		font-weight: 800;
		color: #60a5fa;
	}
	.btn-claim {
		padding: 0.5rem 1.2rem;
		border-radius: 8px;
		border: none;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
		cursor: pointer;
		font-family: 'Rajdhani', sans-serif;
		box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
		transition: box-shadow 0.15s, transform 0.1s;
		white-space: nowrap;
	}
	.btn-claim:hover {
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
		transform: translateY(-1px);
	}
	.claim-countdown {
		font-size: 0.85rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.3);
		white-space: nowrap;
	}

	.stats-grid {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 12px;
		overflow: hidden;
	}
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.03);
	}
	.stat-item:last-child { border-bottom: none; }
	.stat-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.stat-value {
		font-size: 0.9rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.75);
		text-align: right;
	}
	.stat-value.accent {
		color: #60a5fa;
		font-weight: 700;
		font-size: 1rem;
	}

	.logout-btn {
		width: 100%;
		margin-top: auto;
		padding: 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(255, 255, 255, 0.02);
		color: rgba(255, 255, 255, 0.35);
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		font-family: 'Rajdhani', sans-serif;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}
	.logout-btn:hover {
		background: rgba(255, 77, 77, 0.06);
		color: #ff4d4d;
		border-color: rgba(255, 77, 77, 0.15);
	}
</style>
