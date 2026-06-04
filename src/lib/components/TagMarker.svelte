<script lang="ts">
	import { tagImageUrl } from '$lib/calibration/pattern';
	import { onMount } from 'svelte';

	let {
		id,
		sizePx,
		left,
		top
	}: {
		id: number;
		sizePx: number;
		left: number;
		top: number;
	} = $props();

	let canvas: HTMLCanvasElement | undefined = $state();

	onMount(() => {
		draw();
	});

	$effect(() => {
		id;
		sizePx;
		draw();
	});

	function draw() {
		if (!canvas || sizePx < 1) return;
		const px = Math.round(sizePx);
		canvas.width = px;
		canvas.height = px;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		img.onload = () => {
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, px, px);
			ctx.drawImage(img, 0, 0, px, px);
		};
		img.src = tagImageUrl(id);
	}
</script>

<canvas
	bind:this={canvas}
	class="absolute select-none"
	style:left="{left}px"
	style:top="{top}px"
	style:width="{Math.round(sizePx)}px"
	style:height="{Math.round(sizePx)}px"
	style:image-rendering="pixelated"
	aria-hidden="true"
></canvas>
