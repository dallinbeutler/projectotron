<script lang="ts">
	import { base } from '$app/paths';
	import { bestGutterFor, calibrationGutters } from '$lib/calibration/gutters';
	import GutterPanel from '$lib/components/GutterPanel.svelte';
	import SessionQr from '$lib/components/SessionQr.svelte';
	import { sessionState } from '$lib/session.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import UsageHelp from './UsageHelp.svelte';

	const MIN_MARGIN = 0.04;
	const MAX_MARGIN = 0.2;
	const MIN_HEIGHT = 500;
	const MAX_HEIGHT = 3000;
	const MIN_WIDTH = 800;
	const MAX_WIDTH = 5000;
	let helpOpen = $state(true);
	let {
		sessionCode = '',
		calibrated = false,
		width = $bindable(1920),
		height = $bindable(1080),
		margin = $bindable(0.08),
		showOverlays = $bindable(true),
	}: {
		sessionCode?: string;
		calibrated?: boolean;
		width?: number;
		height?: number;
		margin?: number;
		showOverlays?: boolean;
	} = $props();

	const apriltagSize = $derived(Math.min(160, Math.floor(160 + 60 )));

</script>
	<Dialog.Root bind:open={showOverlays}>
		<Dialog.Trigger type="button" class="rounded-lg text-zinc-200 m-50 px-8 py-1.5  hover:border-amber-500 hover:text-amber-300 border-1 border-amber-500">
      toggle ui
		</Dialog.Trigger>
	  <Dialog.Content>
			
			<div class="rounded-lg px-3 py-2 text-xs shadow-lg">
				<p class="mb-1 font-medium text-amber-400">Tag grid inset</p>
				<p class="mb-2 text-[10px] leading-snug">
					Adjust so corner tags sit on your work surface edges.
				</p>
				<p>
					margin
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
				<p >
					aspect ratio adjustment
				</p>
				<input
					type="range"
					min={MIN_HEIGHT}
					max={MAX_HEIGHT}
					step="1"
					bind:value={height}
					class="w-full accent-amber-500"
					aria-label="Tag grid height"
				/>
			</div>
			<div class="rounded-lg p-1 font-mono">
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
			<div class="flex flex-col items-end gap-2 text-xs">
			    <Dialog.Root bind:open={helpOpen}>
					<Dialog.Trigger type="button" class="rounded-lg border border-zinc-600 bg-zinc-950/90 px-3 py-1.5 text-zinc-400 hover:border-amber-500 hover:text-amber-300">
						Help
					</Dialog.Trigger>
					<Dialog.Content>
						<UsageHelp  />
					</Dialog.Content>
				</Dialog.Root>
				{#if calibrated}
					<a
						href="{base}/reproject/"
						class="rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-zinc-950 hover:bg-amber-400"
					>	Reproject →
					</a>
				{/if}
			</div>
			<!-- {#if sessionCode } -->
			<SessionQr sessionCode={sessionCode} layout={{ width, height, margin }} size={apriltagSize * 2} />
		
			<!-- {/if} -->
		</Dialog.Content>
	</Dialog.Root>
	

