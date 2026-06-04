<script lang="ts">
	import { base } from '$app/paths';
	import { bestGutterFor, calibrationGutters } from '$lib/calibration/gutters';
	import { projectorSize } from '$lib/calibration/pattern';
	import GutterPanel from '$lib/components/GutterPanel.svelte';
	import SessionQr from '$lib/components/SessionQr.svelte';
	import { sessionState } from '$lib/session.svelte';

	let {
		sessionCode = '',
		calibrated = false,
		showOverlays = $bindable(true),
		onToggleHelp
	}: {
		sessionCode?: string;
		calibrated?: boolean;
		showOverlays?: boolean;
		onToggleHelp?: () => void;
	} = $props();

	let width = $state(1920);
	let height = $state(1080);

	$effect(() => {
		if (typeof window === 'undefined') return;
		const update = () => {
			const size = projectorSize();
			width = size.width;
			height = size.height;
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});

	const gutters = $derived(calibrationGutters(width, height));
	const qrGutter = $derived(
		bestGutterFor(gutters, 120, 140, ['bottomBar', 'bottomLeft', 'bottomRight', 'centerBottom'])
	);
	const statusGutter = $derived(
		bestGutterFor(gutters, 100, 48, ['leftBar', 'leftBottom', 'leftTop', 'bottomLeft'])
	);
	const navGutter = $derived(
		bestGutterFor(gutters, 80, 80, ['rightBar', 'rightTop', 'topBar', 'topRight'])
	);
	const qrSize = $derived(Math.min(160, Math.floor(Math.min(qrGutter?.width ?? 160, qrGutter?.height ?? 160) - 16)));
</script>

<!-- Always-visible overlay toggle (sits in margin, not on tags) -->
<button
	type="button"
	class="pointer-events-auto absolute z-20 rounded-lg border border-zinc-600 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-300 shadow-lg hover:border-amber-500 hover:text-amber-300"
	style:left="{gutters.leftBar.left + 8}px"
	style:top="{gutters.leftBar.top + 8}px"
	onclick={() => (showOverlays = !showOverlays)}
	aria-pressed={showOverlays}
>
	{showOverlays ? 'Hide UI' : 'Show UI'}
</button>

{#if showOverlays}
	<GutterPanel rect={statusGutter ?? gutters.leftBar} visible={!!sessionCode}>
		<div class="rounded-lg bg-zinc-950/90 px-3 py-2 font-mono text-xs text-zinc-300 shadow-lg">
			<span class="text-zinc-500">Session </span>{sessionCode}
			{#if calibrated}
				<span class="mt-1 block text-emerald-400">Calibrated</span>
			{:else if sessionState.connected}
				<span class="mt-1 block text-emerald-400">Phone linked</span>
			{:else}
				<span class="mt-1 block text-amber-400">Waiting for phone…</span>
			{/if}
		</div>
	</GutterPanel>

	{#if sessionCode && qrGutter}
		<GutterPanel rect={qrGutter}>
			<SessionQr sessionCode={sessionCode} size={qrSize} />
		</GutterPanel>
	{/if}

	<GutterPanel rect={navGutter ?? gutters.rightBar}>
		<div class="flex flex-col items-end gap-2 text-xs">
			{#if onToggleHelp}
				<button
					type="button"
					class="rounded-lg border border-zinc-600 bg-zinc-950/90 px-3 py-1.5 text-zinc-400 hover:border-amber-500 hover:text-amber-300"
					onclick={onToggleHelp}
				>
					Help
				</button>
			{/if}
			{#if calibrated}
				<a
					href="{base}/reproject/"
					class="rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-zinc-950 hover:bg-amber-400"
				>
					Reproject →
				</a>
			{/if}
		</div>
	</GutterPanel>
{/if}
