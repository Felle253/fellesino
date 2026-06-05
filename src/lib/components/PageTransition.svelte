<script lang="ts">
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { goto } from '$app/navigation';

	let show = $state(false);
	let phase = $state<'closing' | 'opening' | ''>('');
	let skippingNav = $state(false);

	function delay(ms: number) {
		return new Promise((r) => setTimeout(r, ms));
	}

	beforeNavigate(({ cancel, to, from, willUnload }) => {
		if (willUnload) return;
		if (skippingNav) { skippingNav = false; return; }
		if (show) return;

		cancel();

		show = true;

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				phase = 'closing';
			});
		});

		delay(500).then(() => {
			phase = 'opening';
			skippingNav = true;
			goto(to!.url.href);
		});
	});

	afterNavigate(() => {
		if (phase === 'opening') {
			delay(300).then(() => {
				show = false;
				phase = '';
			});
		}
	});
</script>

{#if show}
	<div class="pt-overlay" class:closing={phase === 'closing'} class:opening={phase === 'opening'}>
		<div class="pt-bg"></div>
		<div class="pt-content">
			<div class="pt-logo-wrap">
				<div class="pt-line" aria-hidden="true"></div>
				<h1 class="pt-logo">Fellesino</h1>
			</div>
		</div>
	</div>
{/if}

<style>
	.pt-overlay {
		position: fixed;
		inset: 0;
		z-index: 9998;
		overflow: hidden;
	}

	.pt-overlay.opening {
		animation: ptFadeOut 250ms ease-out forwards;
	}

	.pt-bg {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)),
			url('/images/MainBG3.png') center/cover no-repeat;
	}

	.pt-content {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pt-logo-wrap {
		position: relative;
		display: inline-block;
		padding: 0.2em 0.4em;
	}

	.pt-logo {
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
	}

	.pt-overlay.closing .pt-logo {
		animation: ptRevealText 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.pt-overlay.opening .pt-logo {
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}

	.pt-line {
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
		pointer-events: none;
		z-index: 2;
		opacity: 0;
	}

	.pt-overlay.closing .pt-line {
		animation: ptLineSweep 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes ptRevealText {
		0% { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
		100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
	}

	@keyframes ptLineSweep {
		0% { background-position: 100% 100%; opacity: 0; }
		5% { opacity: 1; }
		95% { opacity: 1; }
		100% { background-position: 0% 0%; opacity: 0; }
	}

	@keyframes ptFadeOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}
</style>
