<script lang="ts">
	import { goto } from '$app/navigation';

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

<nav class="topbar">
	<a href="/" class="logo">Fellesino</a>
	<div class="topbar-right">
		<a href="/" class="btn-login">Home</a>
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

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
		background: #fff;
		color: #666;
		min-height: 100vh;
	}

	.topbar {
		display: flex;
		align-items: center;
		height: 60px;
		padding: 0 1.5rem;
		background: #fff;
		border-bottom: 1px solid #e5e5e5;
		gap: 2rem;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.logo {
		font-family: 'Casino', cursive;
		font-size: 1.35rem;
		color: #000;
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
		color: #555;
		padding: 0.42rem 1rem;
		border-radius: 6px;
		border: 1px solid #ccc;
		background: #fff;
		cursor: pointer;
	}

	.btn-register {
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 700;
		color: #fff;
		background: #000;
		padding: 0.44rem 1.1rem;
		border-radius: 6px;
		border: 1px solid #000;
		cursor: pointer;
	}

	.profile-container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 0 1.5rem;
	}

	.profile-card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 10px;
		overflow: hidden;
	}

	.profile-header {
		padding: 2rem;
		border-bottom: 1px solid #e5e5e5;
		background: #f9f9f9;
	}

	.profile-header h1 {
		margin: 0;
		font-size: 1.8rem;
		color: #000;
	}

	.profile-content {
		padding: 2rem;
	}

	.profile-info {
		display: grid;
		gap: 1.5rem;
	}

	.info-group {
		border-bottom: 1px solid #e5e5e5;
		padding-bottom: 1rem;
	}

	.info-group:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-group label {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #bbb;
		display: block;
		margin-bottom: 0.5rem;
	}

	.info-group p {
		margin: 0;
		font-size: 1rem;
		color: #333;
		font-weight: 500;
	}
</style>
