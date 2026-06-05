<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	let { data } = $props();
	const user = $derived(data.user);

	function formatDate(date: string | Date | null) {
		if (!date) return 'Unknown';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function handleLogout() {
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/?/logout';
		document.body.appendChild(form);
		form.submit();
	}
</script>

<div class="page-wrap">

<nav class="topbar">
	<a href="{base}/" class="logo">Fellesino</a>
	<div class="topbar-right">
		<a href="{base}/" class="btn-login">Home</a>
		<button class="btn-register" type="button" onclick={handleLogout}>Logout</button>
	</div>
</nav>

<main class="profile-container">
	<div class="profile-card">
		<div class="profile-header">
			<h1>Profile</h1>
		</div>

		<div class="profile-content">
			<div class="profile-info">
				<div class="info-group">
					<span>Username</span>
					<p>{user.username}</p>
				</div>

				<div class="info-group">
					<span>Coins</span>
					<p class="coins-value">${user.coins}</p>
				</div>

				<div class="info-group">
					<span>Email</span>
					<p>{user.email || 'Not provided'}</p>
				</div>

				<div class="info-group">
					<span>Account Created</span>
					<p>{formatDate(user.createdAt)}</p>
				</div>

				<div class="info-group">
					<span>Last Active</span>
					<p>{formatDate(user.lastActive)}</p>
				</div>
			</div>
		</div>
	</div>
</main>

</div>

<style>
	.page-wrap {
		min-height: 100vh;
		background-image: url('/images/MainBG.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-color: #0a0a0a;
	}

	.topbar {
		display: flex;
		align-items: center;
		height: 4rem;
		padding: 0 2rem;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(59, 130, 246, 0.2);
		gap: 2rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.logo {
		font-family: 'Casino', cursive;
		font-size: 1.6rem;
		color: #fff;
		text-decoration: none;
		letter-spacing: 1px;
		flex-shrink: 0;
		text-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
		transition: text-shadow 0.2s;
	}
	.logo:hover {
		text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
	}

	.logo {
		font-family: 'Casino', cursive;
		font-size: 1.6rem;
		color: #fff;
		text-decoration: none;
		letter-spacing: 1px;
		flex-shrink: 0;
		text-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
		transition: text-shadow 0.2s;
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
		transform: translateY(-1px);
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

	.profile-container {
		max-width: 640px;
		margin: 5rem auto;
		padding: 0 1.5rem;
	}

	.profile-card {
		background: rgba(15, 15, 15, 0.8);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(59, 130, 246, 0.1);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
	}

	.profile-header {
		padding: 2rem 2.5rem 1.5rem;
		border-bottom: 1px solid rgba(59, 130, 246, 0.08);
	}

	.profile-header h1 {
		margin: 0;
		font-size: 1.8rem;
		color: #fff;
		font-weight: 700;
		letter-spacing: 0.01em;
	}

	.profile-content {
		padding: 2rem 2.5rem;
	}

	.profile-info {
		display: grid;
		gap: 1.5rem;
	}

	.info-group {
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		padding-bottom: 1.2rem;
	}

	.info-group:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-group p {
		margin: 0;
		font-size: 1.15rem;
		color: rgba(255, 255, 255, 0.85);
		font-weight: 500;
	}

	.coins-value {
		color: #60a5fa !important;
		font-weight: 700 !important;
	}
</style>
