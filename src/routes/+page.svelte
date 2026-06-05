<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import CalibrationPattern from '$lib/components/CalibrationPattern.svelte';
	import UsageHelp from '$lib/components/UsageHelp.svelte';
	import { shouldShowUsageHelpOnLoad } from '$lib/usageHelp';
	import {
		createAndJoin,
		ensureSyncRoom,
		restoreSessionCode,
		sessionState
	} from '$lib/session.svelte';
	import { onMount } from 'svelte';

	let ready = $state(false);
	let helpOpen = $state(false);
	let bootError = $state('');

	onMount(async () => {
		restoreSessionCode();
		try {
			if (!sessionState.code) {
				await createAndJoin('projector');
			}
			await ensureSyncRoom();
			helpOpen = shouldShowUsageHelpOnLoad();
			ready = true;
			if (typeof document !== 'undefined' && !document.fullscreenElement) {
				try {
					await document.documentElement.requestFullscreen();
				} catch {
					// Browser may block without a user gesture
				}
			}
		} catch (e) {
			bootError = e instanceof Error ? e.message : 'Failed to start session';
			ready = true;
		}
	});

	function openHelp() {
		helpOpen = true;
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		if (
			sessionState.role === 'projector' &&
			sessionState.calibration?.status === 'ready'
		) {
			void goto(`${base}/reproject/`);
		}
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
				const target = e.target as HTMLElement | null;
				if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
				e.preventDefault();
				helpOpen = true;
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if bootError}
	<p class="fixed inset-0 flex items-center justify-center bg-black p-8 text-center text-red-400">
		{bootError}
	</p>
{:else if ready}
	<CalibrationPattern
		sessionCode={sessionState.code}
		calibrated={sessionState.calibration?.status === 'ready'}
		onToggleHelp={openHelp}
	/>
{:else}
	<div class="fixed inset-0 flex items-center justify-center bg-black text-zinc-500">
		Starting…
	</div>
{/if}
