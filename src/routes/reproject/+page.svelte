<script lang="ts">
	import { base } from '$app/paths';
	import FineTuneRect from '$lib/components/FineTuneRect.svelte';
	import MediaUpload from '$lib/components/MediaUpload.svelte';
	import ZoomSlider from '$lib/components/ZoomSlider.svelte';
	import { projCornersFromCalibration } from '$lib/projection/corners';
	import { loadImageFile } from '$lib/media/image';
	import { getPdfPageCount, renderPdfPage } from '$lib/media/pdf';
	import { warpToProjectorFast } from '$lib/projection/warp';
	import {
		ensureSyncRoom,
		loadCalibrationFromText,
		pushFineTune,
		sessionState,
		setCalibration
	} from '$lib/session.svelte';
	import { DEFAULT_FINE_TUNE, type FineTuneSettings } from '$lib/types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let sourceCanvas = $state<HTMLCanvasElement | null>(null);
	let sourcePreviewEl = $state<HTMLCanvasElement | null>(null);
	let outputCanvas = $state<HTMLCanvasElement | null>(null);
	let fineTune = $state<FineTuneSettings>({ ...DEFAULT_FINE_TUNE });
	let fullscreen = $state(false);
	let pdfPages = $state(1);
	let pdfPage = $state(1);
	let currentFile = $state<File | null>(null);
	let loading = $state(false);
	let importText = $state('');
	let showControls = $state(true);

	const sourceAspect = $derived(
		sourceCanvas && sourceCanvas.height > 0 ? sourceCanvas.width / sourceCanvas.height : 4 / 3
	);

	onMount(() => {
		if (!sessionState.code) {
			goto(`${base}/`);
			return;
		}
		void ensureSyncRoom();
		if (sessionState.fineTune) fineTune = { ...sessionState.fineTune };
	});

	function syncSourcePreview() {
		if (!sourceCanvas || !sourcePreviewEl) return;
		sourcePreviewEl.width = sourceCanvas.width;
		sourcePreviewEl.height = sourceCanvas.height;
		const ctx = sourcePreviewEl.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, sourcePreviewEl.width, sourcePreviewEl.height);
		ctx.drawImage(sourceCanvas, 0, 0);
	}

	async function handleFile(file: File, type: 'image' | 'pdf') {
		loading = true;
		currentFile = file;
		try {
			if (type === 'pdf') {
				pdfPages = await getPdfPageCount(file);
				pdfPage = 1;
				sourceCanvas = await renderPdfPage(file, pdfPage);
			} else {
				pdfPages = 1;
				sourceCanvas = await loadImageFile(file);
			}
			syncSourcePreview();
			renderOutput();
		} finally {
			loading = false;
		}
	}

	async function changePdfPage() {
		if (!currentFile) return;
		loading = true;
		try {
			sourceCanvas = await renderPdfPage(currentFile, pdfPage);
			syncSourcePreview();
			renderOutput();
		} finally {
			loading = false;
		}
	}

	function renderOutput() {
		if (!sourceCanvas || !outputCanvas || !sessionState.calibration) return;
		outputCanvas.width = window.innerWidth;
		outputCanvas.height = window.innerHeight;
		const corners = projCornersFromCalibration(
			sessionState.calibration,
			outputCanvas.width,
			outputCanvas.height
		);
		warpToProjectorFast({
			sourceCanvas,
			outputCanvas,
			projCorners: corners,
			fineTune
		});
	}

	$effect(() => {
		fineTune;
		sourceCanvas;
		sessionState.calibration;
		syncSourcePreview();
		renderOutput();
	});

	async function syncFineTune() {
		await pushFineTune(fineTune);
	}

	function toggleFullscreen() {
		const el = outputCanvas?.parentElement;
		if (!el) return;
		if (!document.fullscreenElement) {
			el.requestFullscreen();
			fullscreen = true;
			showControls = false;
		} else {
			document.exitFullscreen();
			fullscreen = false;
			showControls = true;
		}
	}

	function handleImportCalibration() {
		try {
			setCalibration(loadCalibrationFromText(importText));
		} catch {
			/* invalid JSON */
		}
	}
</script>

<svelte:window onresize={renderOutput} />

<div class="flex min-h-[calc(100vh-57px)] flex-col">
	{#if !sessionState.calibration}
		<div class="mx-auto max-w-lg p-8 text-center">
			<p class="mb-4 text-zinc-400">Waiting for calibration from phone…</p>
			<details class="rounded-lg border border-zinc-800 p-4 text-left">
				<summary class="cursor-pointer text-sm text-zinc-500">Import calibration JSON manually</summary>
				<textarea
					class="mt-2 h-32 w-full rounded border border-zinc-700 bg-zinc-900 p-2 font-mono text-xs"
					bind:value={importText}
				></textarea>
				<button
					type="button"
					class="mt-2 rounded bg-amber-500 px-3 py-1 text-sm text-zinc-950"
					onclick={handleImportCalibration}
				>
					Load
				</button>
			</details>
			<a href="{base}/" class="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300">← Calibration</a>
		</div>
	{:else}
		<div class="relative flex min-h-0 flex-1 bg-black">
			<canvas bind:this={outputCanvas} class="absolute inset-0 h-full w-full"></canvas>

			{#if showControls && sourceCanvas}
				<div
					class="absolute inset-0 z-10 flex items-center justify-center p-4"
					style:pointer-events="none"
				>
					<div
						class="relative max-h-full max-w-full shadow-2xl"
						style:aspect-ratio={sourceAspect}
						style:width={`min(100%, calc((100vh - 120px) * ${sourceAspect}))`}
						style:pointer-events="auto"
					>
						<canvas
							bind:this={sourcePreviewEl}
							class="block h-full w-full rounded-lg border border-zinc-700 bg-zinc-900"
						></canvas>
						<div class="absolute inset-0 rounded-lg">
							<FineTuneRect bind:settings={fineTune} showFields={false} fill />
						</div>
					</div>
				</div>
			{/if}

			{#if showControls}
				<aside
					class="absolute top-4 right-4 z-20 w-72 max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-xl"
				>
					<h1 class="mb-3 text-lg font-semibold">Reprojection</h1>

					<MediaUpload onFile={handleFile} />

					{#if pdfPages > 1}
						<label class="mt-3 flex flex-col gap-1 text-xs text-zinc-400">
							PDF page
							<input
								type="number"
								min="1"
								max={pdfPages}
								bind:value={pdfPage}
								onchange={changePdfPage}
								class="rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
							/>
						</label>
					{/if}

					{#if loading}
						<p class="mt-2 text-xs text-amber-400">Loading…</p>
					{/if}

					{#if sourceCanvas}
						<p class="mt-3 text-xs text-zinc-500">
							Drag the amber rectangle on your pattern (center). Enter its real-world size below.
						</p>
					{/if}

					<div class="mt-4 border-t border-zinc-800 pt-4">
						<h2 class="mb-2 text-sm font-medium text-zinc-300">Fine-tune</h2>
						<FineTuneRect bind:settings={fineTune} showPreview={false} />
						<div class="mt-3">
							<ZoomSlider bind:zoom={fineTune.zoom} />
						</div>
						<button
							type="button"
							class="mt-3 w-full rounded border border-zinc-600 py-1 text-xs hover:border-amber-500"
							onclick={syncFineTune}
						>
							Sync settings to session
						</button>
					</div>

					<div class="mt-4 flex flex-col gap-2">
						<button
							type="button"
							class="rounded-lg bg-amber-500 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
							onclick={toggleFullscreen}
						>
							{fullscreen ? 'Exit fullscreen' : 'Fullscreen project'}
						</button>
						<a href="{base}/" class="text-center text-xs text-zinc-500 hover:text-zinc-300">← Calibration</a>
					</div>
				</aside>
			{:else}
				<button
					type="button"
					class="absolute top-4 right-4 z-20 rounded bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400"
					onclick={toggleFullscreen}
				>
					Show controls
				</button>
			{/if}
		</div>
	{/if}
</div>
