<script lang="ts">
	import {
		detectionToCameraPoint,
		frameToGrayscale,
		getAprilTagDetector,
		type AprilTagDetection
	} from '$lib/calibration/detect';
	import { CALIBRATION_MARKERS, getMarkerById, markerCenterPx } from '$lib/calibration/pattern';
	import { solveFromMarkers } from '$lib/calibration/solve';
	import { sessionState } from '$lib/session.svelte';
	import type { CalibrationData, MarkerObservation } from '$lib/types';
	import { onMount, tick } from 'svelte';

	let {
		onCalibrated,
		onDetections
	}: {
		onCalibrated?: (data: CalibrationData) => void;
		onDetections?: (count: number, locked: boolean) => void;
	} = $props();

	const TAG_COUNT = CALIBRATION_MARKERS.length;
	const STABLE_FRAMES = 8;

	let videoEl: HTMLVideoElement | undefined = $state();
	let overlayEl: HTMLCanvasElement | undefined = $state();
	let loading = $state(true);
	let error = $state('');
	let matchedCount = $state(0);
	let locked = $state(false);
	let stableCount = $state(0);

	const canCalibrate = $derived(!!sessionState.projectorLayout);

	onMount(() => {
		let stream: MediaStream | null = null;

		async function start() {
			try {
				await tick();
				if (!videoEl) {
					error = 'Camera view failed to initialize';
					loading = false;
					return;
				}

				const detectorPromise = getAprilTagDetector();
				stream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: 1280 },
						height: { ideal: 720 }
					}
				});

				videoEl.srcObject = stream;
				await videoEl.play();
				await detectorPromise;
				loading = false;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Camera access denied';
				loading = false;
			}
		}

		start();

		return () => {
			stream?.getTracks().forEach((t) => t.stop());
		};
	});

	$effect(() => {
		if (loading || !videoEl || !overlayEl) return;

		let raf = 0;
		let lastDetect = 0;
		let lastMarkerIds: number[] = [];

		async function detectFrame() {
			if (!videoEl || !overlayEl || locked) return;
			const now = performance.now();
			if (now - lastDetect < 120) return;
			lastDetect = now;

			const vw = videoEl.videoWidth;
			const vh = videoEl.videoHeight;
			if (!vw || !vh) return;

			overlayEl.width = vw;
			overlayEl.height = vh;
			const octx = overlayEl.getContext('2d');
			if (!octx) return;
			octx.clearRect(0, 0, vw, vh);
			octx.drawImage(videoEl, 0, 0);

			const imageData = octx.getImageData(0, 0, vw, vh);
			const { gray, width, height, scale } = frameToGrayscale(imageData);
			const detector = await getAprilTagDetector();
			const found: AprilTagDetection[] = detector.detect(gray, width, height);

			const currentLayout = sessionState.projectorLayout;
			const markers: MarkerObservation[] = [];

			for (const det of found) {
				octx.strokeStyle = currentLayout ? '#22c55e' : '#71717a';
				octx.lineWidth = 3;
				octx.beginPath();
				for (const c of det.corners) {
					octx.lineTo(c.x / scale, c.y / scale);
				}
				octx.closePath();
				octx.stroke();

				octx.fillStyle = '#fbbf24';
				octx.font = '16px monospace';
				octx.fillText(String(det.id), det.center.x / scale - 8, det.center.y / scale - 12);

				if (!currentLayout) continue;
				const marker = getMarkerById(det.id);
				if (!marker) continue;
				markers.push({
					id: det.id,
					proj: markerCenterPx(
						marker,
						currentLayout.width,
						currentLayout.height,
						currentLayout.margin
					),
					cam: detectionToCameraPoint(det, scale)
				});
			}

			matchedCount = markers.length;
			onDetections?.(markers.length, locked);

			if (!currentLayout) {
				stableCount = 0;
				lastMarkerIds = [];
				return;
			}

			if (markers.length >= TAG_COUNT) {
				const ids = markers.map((m) => m.id).sort((a, b) => a - b);
				const same =
					lastMarkerIds.length === ids.length && ids.every((id, i) => lastMarkerIds[i] === id);
				stableCount = same ? stableCount + 1 : 0;
				lastMarkerIds = ids;

				if (stableCount >= STABLE_FRAMES) {
					const result = solveFromMarkers(markers);
					if (result) {
						locked = true;
						onCalibrated?.({
							homography: result.homography,
							homographyInv: result.homographyInv,
							projector: { width: currentLayout.width, height: currentLayout.height },
							markers,
							updatedAt: Date.now(),
							status: 'ready'
						});
					}
				}
			} else {
				stableCount = 0;
				lastMarkerIds = [];
			}
		}

		function loop() {
			void detectFrame();
			raf = requestAnimationFrame(loop);
		}

		loop();

		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="relative h-full w-full overflow-hidden bg-black">
	{#if loading}
		<div class="absolute inset-0 z-10 flex items-center justify-center bg-black text-zinc-400">
			Starting camera…
		</div>
	{/if}
	{#if !loading && !canCalibrate}
		<div
			class="absolute top-0 right-0 left-0 z-10 bg-amber-950/90 px-4 py-2 text-center text-xs text-amber-300"
		>
			Waiting for projector resolution — scan the QR on the calibration screen or keep it open.
		</div>
	{/if}
	{#if error}
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
			<p class="text-red-400">{error}</p>
			<p class="text-sm text-zinc-500">Grant camera permission and reload.</p>
		</div>
	{/if}
	<video bind:this={videoEl} class="h-full w-full object-cover" playsinline muted></video>
	<canvas bind:this={overlayEl} class="pointer-events-none absolute inset-0 h-full w-full object-cover"
	></canvas>

	<div class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
		<div class="flex items-center justify-between text-sm">
			<span class="text-zinc-300">
				{#if canCalibrate}
					{matchedCount}/{TAG_COUNT} tags matched
				{:else}
					Scan projector QR for layout
				{/if}
			</span>
			{#if locked}
				<span class="font-medium text-emerald-400">Calibration locked</span>
			{:else if canCalibrate}
				<span class="text-amber-400">Hold steady ({stableCount}/{STABLE_FRAMES})</span>
			{/if}
		</div>
	</div>
</div>
