<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import ProfileSidebar from '$lib/components/ProfileSidebar.svelte';
	import PageTransition from '$lib/components/PageTransition.svelte';

	let { children } = $props();
	let showSplash = $state(true);

	$effect(() => {
		if (showSplash) {
			const timer = setTimeout(() => {
				showSplash = false;
			}, 2400);
			return () => clearTimeout(timer);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if showSplash}
	<div class="splash-overlay" transition:fade={{ duration: 400 }}>
		<div class="splash-content">
			<div class="splash-logo-wrap">
				<div class="splash-line" aria-hidden="true"></div>
				<h1 class="splash-logo">Fellesino</h1>
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<ProfileSidebar data={$page.data} />
<PageTransition />

<style>
	.splash-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background:
			linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)),
			url('/images/MainBG3.png') center/cover no-repeat;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.splash-content {
		text-align: center;
	}

	.splash-logo-wrap {
		position: relative;
		display: inline-block;
		padding: 0.2em 0.4em;
	}

	.splash-logo {
		margin: 0;
		position: relative;
		z-index: 1;
		font-family: 'Rajdhani', sans-serif;
		font-weight: 900;
		font-size: clamp(3rem, 6vw, 6rem);
		color: #fff;
		text-shadow: 0 0 40px rgba(59, 130, 246, 0.3), 0 0 80px rgba(59, 130, 246, 0.15);
		letter-spacing: 2px;
		clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
		animation: diagonalReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards;
	}

	.splash-line {
		position: absolute;
		top: 0; left: 0;
		width: 100%; height: 100%;
		background: linear-gradient(
			135deg,
			transparent calc(50% - 1.5px),
			rgba(59,130,246,0.5) calc(50% - 1.5px),
			#fff calc(50%),
			rgba(59,130,246,0.5) calc(50% + 1.5px),
			transparent calc(50% + 1.5px)
		);
		background-size: 200% 200%;
		background-position: 100% 100%;
		animation: lineSweep 1.4s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards;
		z-index: 2;
		pointer-events: none;
	}

	@keyframes diagonalReveal {
		0% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
		100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
	}

	@keyframes lineSweep {
		0% { background-position: 100% 100%; }
		100% { background-position: 0% 0%; }
	}

</style>
