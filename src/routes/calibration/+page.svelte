<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto(`${base}/`, { replaceState: true });
	});
</script>

<p class="fixed inset-0 flex items-center justify-center bg-black text-zinc-500">Redirecting…</p>
