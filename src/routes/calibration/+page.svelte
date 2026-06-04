<script lang="ts">
	import { base } from '$app/paths';
	import CalibrationPattern from '$lib/components/CalibrationPattern.svelte';
	import { ensureSyncRoom, sessionState } from '$lib/session.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		if (!sessionState.code) {
			goto(`${base}/`);
			return;
		}
		void ensureSyncRoom();
	});
</script>

{#if sessionState.code}
	<CalibrationPattern
		sessionCode={sessionState.code}
		calibrated={sessionState.calibration?.status === 'ready'}
	/>
{:else}
	<p class="p-8 text-center text-zinc-500">Join a session from the home page.</p>
{/if}

<a
	href="{base}/"
	class="fixed bottom-4 left-4 rounded-lg bg-zinc-900/90 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
>
	← Exit
</a>
