<script lang="ts">
	import { base } from '$app/paths';
	import { bestGutterFor, calibrationGutters } from '$lib/calibration/gutters';
	import GutterPanel from '$lib/components/GutterPanel.svelte';
	import SessionQr from '$lib/components/SessionQr.svelte';
	import { sessionState } from '$lib/session.svelte';

	const MIN_MARGIN = 0.04;
	const MAX_MARGIN = 0.2;

	let {
		sessionCode = '',
		calibrated = false,
		width = 1920,
		height = 1080,
		margin = $bindable(0.08),
		showOverlays = $bindable(true),
		onToggleHelp
	}: {
		sessionCode?: string;
		calibrated?: boolean;
		width?: number;
		height?: number;
		margin?: number;
		showOverlays?: boolean;
		onToggleHelp?: () => void;
	} = $props();

	const gutters = $derived(calibrationGutters(width, height, margin));
	const qrGutter = $derived(
		bestGutterFor(gutters, 120, 140, ['bottomBar', 'bottomLeft', 'bottomRight', 'centerBottom'])
	);
	const statusGutter = $derived(
		bestGutterFor(gutters, 100, 48, ['leftBar', 'leftBottom', 'leftTop', 'bottomLeft'])
	);
	const navGutter = $derived(
		bestGutterFor(gutters, 80, 80, ['rightBar', 'rightTop', 'topBar', 'topRight'])
	);
	const layoutGutter = $derived(
		bestGutterFor(gutters, 160, 72, ['rightBar', 'rightBottom', 'rightTop'])
	);
	const qrSize = $derived(Math.min(160, Math.floor(Math.min(qrGutter?.width ?? 160, qrGutter?.height ?? 160) - 16)));
	const showLayoutControls = $derived(sessionState.connected && !showOverlays);
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

{#if showLayoutControls && layoutGutter}
	<GutterPanel rect={layoutGutter}>
		<div class="rounded-lg bg-zinc-950/90 px-3 py-2 text-xs text-zinc-300 shadow-lg">
			<p class="mb-1 font-medium text-amber-400">Tag grid inset</p>
			<p class="mb-2 text-[10px] leading-snug text-zinc-500">
				Adjust so corner tags sit on your work surface edges.
			</p>
			<input
				type="range"
				min={MIN_MARGIN}
				max={MAX_MARGIN}
				step="0.005"
				bind:value={margin}
				class="w-full accent-amber-500"
				aria-label="Tag grid margin"
			/>
		</div>
	</GutterPanel>
{/if}

{#if showOverlays}
	<GutterPanel rect={statusGutter ?? gutters.leftBar} visible={!!sessionCode}>
		<div class="rounded-lg bg-zinc-950/90 px-3 py-2 font-mono text-xs text-zinc-300 shadow-lg">
			<span class="text-zinc-500">Session </span>{sessionCode}
			<span class="mt-1 block text-zinc-400">{width}×{height}</span>
			{#if calibrated}
				<span class="mt-1 block text-emerald-400">Calibrated</span>
			{:else if sessionState.connected}
				<span class="mt-1 block text-emerald-400">Phone linked — tags only</span>
			{:else}
				<span class="mt-1 block text-amber-400">Scan QR to link phone…</span>
			{/if}
		</div>
	</GutterPanel>

	{#if sessionCode && qrGutter}
		<GutterPanel rect={qrGutter}>
			<SessionQr sessionCode={sessionCode} layout={{ width, height, margin }} size={qrSize} />
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
