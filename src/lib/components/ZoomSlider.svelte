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
</script>

<label class="flex flex-col gap-2">
	<span class="text-xs text-zinc-400">Fine zoom ({zoom.toFixed(3)}×)</span>
	<input
		type="range"
		{min}
		{max}
		{step}
		bind:value={zoom}
		class="w-full accent-amber-500"
	/>
</label>
