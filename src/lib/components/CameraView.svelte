<script lang="ts">
	import {
		detectionToCameraPoint,
		frameToGrayscale,
		getAprilTagDetector,
		type AprilTagDetection
	} from '$lib/calibration/detect';
	import { getMarkerById, markerCenterPx } from '$lib/calibration/pattern';
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

	let videoEl: HTMLVideoElement | undefined = $state();
	let overlayEl: HTMLCanvasElement | undefined = $state();
	let loading = $state(true);
	let error = $state('');
	let detections = $state<AprilTagDetection[]>([]);
	let locked = $state(false);
	let stableCount = $state(0);

	const STABLE_FRAMES = 8;
	const MIN_MARKERS = 4;

	onMount(() => {
		let stream: MediaStream | null = null;
		let raf = 0;
		let lastDetect = 0;
		let lastMarkers: MarkerObservation[] = [];

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
				loop();
			} catch (e) {
				error = e instanceof Error ? e.message : 'Camera access denied';
				loading = false;
			}
		}

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
			const found = detector.detect(gray, width, height);
			detections = found;

			const layout = sessionState.projectorLayout;
			const markers: MarkerObservation[] = [];

			for (const det of found) {
				octx.strokeStyle = layout ? '#22c55e' : '#71717a';
				octx.lineWidth = 3;
				octx.beginPath();
				for (const c of det.corners) {
					const px = c.x / scale;
					const py = c.y / scale;
					octx.lineTo(px, py);
				}
				octx.closePath();
				octx.stroke();

				octx.fillStyle = '#fbbf24';
				octx.font = '16px monospace';
				octx.fillText(String(det.id), det.center.x / scale - 8, det.center.y / scale - 12);

				if (!layout) continue;
				const marker = getMarkerById(det.id);
				if (!marker) continue;
				markers.push({
					id: det.id,
					proj: markerCenterPx(marker, layout.width, layout.height, layout.margin),
					cam: detectionToCameraPoint(det, scale)
				});
			}

			onDetections?.(markers.length, locked);

			if (!layout) return;

			if (markers.length >= MIN_MARKERS) {
				const same =
					lastMarkers.length === markers.length &&
					markers.every((m) => lastMarkers.some((l) => l.id === m.id));
				stableCount = same ? stableCount + 1 : 0;
				lastMarkers = markers;

				if (stableCount >= STABLE_FRAMES) {
					const result = solveFromMarkers(markers);
					if (result) {
						locked = true;
						const data: CalibrationData = {
							homography: result.homography,
							homographyInv: result.homographyInv,
							projector: { width: layout.width, height: layout.height },
							markers,
							updatedAt: Date.now(),
							status: 'ready'
						};
						onCalibrated?.(data);
					}
				}
			} else {
				stableCount = 0;
				lastMarkers = [];
			}
		}

		function loop() {
			detectFrame();
			raf = requestAnimationFrame(loop);
		}

		start();

		return () => {
			cancelAnimationFrame(raf);
			stream?.getTracks().forEach((t) => t.stop());
		};
	});
</script>

<div class="relative h-full w-full overflow-hidden bg-black">
	{#if loading}
		<div class="absolute inset-0 z-10 flex items-center justify-center bg-black text-zinc-400">
			Starting camera…
		</div>
	{/if}
	{#if !loading && !sessionState.projectorLayout}
		<div
			class="absolute top-0 right-0 left-0 z-10 bg-amber-950/90 px-4 py-2 text-center text-xs text-amber-300"
		>
			Waiting for projector resolution — keep the calibration screen open on the projector.
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
			<span class="text-zinc-300">{detections.length} tags detected</span>
			{#if locked}
				<span class="font-medium text-emerald-400">Calibration locked</span>
			{:else}
				<span class="text-amber-400">Hold steady ({stableCount}/{STABLE_FRAMES})</span>
			{/if}
		</div>
	</div>
</div>
