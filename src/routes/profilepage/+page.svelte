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
					<label>Username</label>
					<p>{user.username}</p>
				</div>

				<div class="info-group">
					<label>Coins</label>
					<p class="coins-value">${user.coins}</p>
				</div>

				<div class="info-group">
					<label>Email</label>
					<p>{user.email || 'Not provided'}</p>
				</div>

				<div class="info-group">
					<label>Account Created</label>
					<p>{formatDate(user.createdAt)}</p>
				</div>

				<div class="info-group">
					<label>Last Active</label>
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
		background-color: #1a1a1a;
	}

	.topbar {
		display: flex;
		align-items: center;
		height: 60px;
		padding: 0 1.5rem;
		background: rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
		transition: background 0.15s;
	}

	.btn-login:hover {
		background: rgba(255, 255, 255, 0.18);
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
		transition: background 0.15s;
	}

	.btn-register:hover {
		background: rgba(0, 0, 0, 0.5);
	}

	.profile-container {
		max-width: 560px;
		margin: 4rem auto;
		padding: 0 1.5rem;
	}

	.profile-card {
		background: rgba(10, 30, 15, 0.6);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.profile-header {
		padding: 1.75rem 2rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.profile-header h1 {
		margin: 0;
		font-size: 1.5rem;
		color: #fff;
		font-weight: 700;
		letter-spacing: 0.01em;
	}

	.profile-content {
		padding: 1.75rem 2rem;
	}

	.profile-info {
		display: grid;
		gap: 1.4rem;
	}

	.info-group {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		padding-bottom: 1.2rem;
	}

	.info-group:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-group label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.4);
		display: block;
		margin-bottom: 0.35rem;
	}

	.info-group p {
		margin: 0;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.85);
		font-weight: 500;
	}

	.coins-value {
		color: #c5a059 !important;
		font-weight: 700 !important;
	}
</style>
