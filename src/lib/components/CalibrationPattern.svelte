<script lang="ts">
	import {
		CALIBRATION_MARKERS,
		markerCenterPx,
		projectorSize,
		tagImageUrl,
		tagSizePx
	} from '$lib/calibration/pattern';

	let {
		sessionCode = '',
		calibrated = false
	}: { sessionCode?: string; calibrated?: boolean } = $props();

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

	const tagSize = $derived(tagSizePx(width, height));
</script>

<div class="fixed inset-0 bg-black">
	{#each CALIBRATION_MARKERS as marker (marker.id)}
		{@const center = markerCenterPx(marker, width, height)}
		<img
			src={tagImageUrl(marker.id)}
			alt="AprilTag {marker.id}"
			class="absolute select-none"
			style:left="{center.x - tagSize / 2}px"
			style:top="{center.y - tagSize / 2}px"
			style:width="{tagSize}px"
			style:height="{tagSize}px"
			draggable="false"
		/>
	{/each}

	<div class="absolute top-4 left-4 rounded-lg bg-zinc-900/80 px-4 py-2 font-mono text-sm text-zinc-300">
		{#if sessionCode}
			<span class="text-zinc-500">Session </span>{sessionCode}
		{/if}
		{#if calibrated}
			<span class="ml-3 text-emerald-400">Calibrated</span>
		{:else}
			<span class="ml-3 text-amber-400">Waiting for phone…</span>
		{/if}
	</div>
</div>
