<script lang="ts">
	let {
		onFile
	}: {
		onFile: (file: File, type: 'image' | 'pdf') => void;
	} = $props();

	let inputEl: HTMLInputElement | undefined = $state();

	function handleChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
		onFile(file, isPdf ? 'pdf' : 'image');
		input.value = '';
	}
</script>

<div class="flex flex-col gap-2">
	<input
		bind:this={inputEl}
		type="file"
		accept="image/png,image/jpeg,image/webp,application/pdf"
		class="hidden"
		onchange={handleChange}
	/>
	<button
		type="button"
		class="rounded-lg border border-dashed border-zinc-600 px-4 py-6 text-sm text-zinc-300 transition hover:border-amber-500 hover:text-amber-200"
		onclick={() => inputEl?.click()}
	>
		Upload image or PDF pattern
	</button>
</div>
