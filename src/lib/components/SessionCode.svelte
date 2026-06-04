<script lang="ts">
	let { code = $bindable(''), readonly = false }: { code?: string; readonly?: boolean } = $props();
</script>

<div class="flex flex-col gap-1">
	<label class="text-xs font-medium tracking-wide text-zinc-400 uppercase" for="session-code">
		Session code
	</label>
	<input
		id="session-code"
		class="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-2xl tracking-[0.35em] text-zinc-100 uppercase focus:border-amber-500 focus:outline-none disabled:opacity-60"
		maxlength="6"
		placeholder="ABC123"
		bind:value={code}
		disabled={readonly}
		autocomplete="off"
		spellcheck="false"
	/>
</div>
