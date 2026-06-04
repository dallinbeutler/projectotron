<script lang="ts">
	import { CALIBRATION_MARKERS, markerCenterPx, projectorSize, tagSizePx } from '$lib/calibration/pattern';
	import CalibrationChrome from '$lib/components/CalibrationChrome.svelte';
	import TagMarker from '$lib/components/TagMarker.svelte';

	let {
		sessionCode = '',
		calibrated = false,
		onToggleHelp
	}: {
		sessionCode?: string;
		calibrated?: boolean;
		onToggleHelp?: () => void;
	} = $props();

	let width = $state(1920);
	let height = $state(1080);
	let showOverlays = $state(true);

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
		<TagMarker
			id={marker.id}
			sizePx={tagSize}
			left={center.x - tagSize / 2}
			top={center.y - tagSize / 2}
		/>
	{/each}

	<CalibrationChrome
		{sessionCode}
		{calibrated}
		bind:showOverlays
		{onToggleHelp}
	/>
</div>
