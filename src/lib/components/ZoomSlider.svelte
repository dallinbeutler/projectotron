<script lang="ts">
	let {
		zoom = $bindable(1),
		min = 0.5,
		max = 1.5,
		step = 0.001
	}: {
		zoom?: number;
		min?: number;
		max?: number;
		step?: number;
	} = $props();

	/** Slider position is inverted so dragging right zooms in. */
	let sliderValue = $derived(max + min - (zoom ?? 1));

	function onSliderInput(e: Event) {
		const raw = Number((e.currentTarget as HTMLInputElement).value);
		zoom = max + min - raw;
	}
</script>

<label class="flex flex-col gap-2">
	<span class="text-xs text-zinc-400">
		Fine zoom ({(1 / zoom).toFixed(3)}× on fabric)
	</span>
	<input
		type="range"
		{min}
		{max}
		{step}
		value={sliderValue}
		oninput={onSliderInput}
		class="w-full accent-amber-500"
	/>
</label>
