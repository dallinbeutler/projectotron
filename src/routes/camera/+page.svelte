<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import CameraView from '$lib/components/CameraView.svelte';
	import { sessionFromSearchParams } from '$lib/joinUrl';
	import {
		downloadCalibration,
		joinSession,
		loadCalibrationFromText,
		pushCalibration,
		sessionState
	} from '$lib/session.svelte';
	import type { CalibrationData } from '$lib/types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let markerCount = $state(0);
	let locked = $state(false);
	let importText = $state('');
	let importError = $state('');
	let cameraKey = $state(0);
	let ready = $state(false);
	let joinError = $state('');

	onMount(async () => {
		joinError = '';
		const fromQr = sessionFromSearchParams(page.url.searchParams);
		try {
			if (fromQr) {
				await joinSession(fromQr, 'phone');
			} else if (!sessionState.code) {
				joinError = 'Scan the QR code on the projector calibration screen to join.';
				ready = true;
				return;
			}
			ready = true;
		} catch (e) {
			joinError = e instanceof Error ? e.message : 'Failed to join session';
			ready = true;
		}
	});

	async function handleCalibrated(data: CalibrationData) {
		try {
			await pushCalibration(data);
			locked = true;
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Failed to sync calibration';
		}
	}

	function handleDetections(count: number, isLocked: boolean) {
		markerCount = count;
		locked = isLocked;
	}

	async function handleImport() {
		importError = '';
		try {
			const data = loadCalibrationFromText(importText);
			await pushCalibration(data);
			locked = true;
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Invalid JSON';
		}
	}

	function recalibrate() {
		locked = false;
		cameraKey += 1;
	}
</script>

<div class="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-semibold">Camera calibration</h1>
			<p class="text-sm text-zinc-500">Point at the projector calibration screen.</p>
		</div>
		<a href="{base}/" class="text-sm text-zinc-400 hover:text-zinc-200">← Calibration</a>
	</div>

	{#if joinError}
		<p class="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
			{joinError}
		</p>
	{/if}

	{#if ready && !joinError}
		<div class="aspect-video overflow-hidden rounded-xl border border-zinc-800">
			{#key cameraKey}
				<CameraView onCalibrated={handleCalibrated} onDetections={handleDetections} />
			{/key}
		</div>

		<div class="flex flex-wrap items-center gap-3 text-sm">
			<span class="text-zinc-400">{markerCount} markers visible</span>
			{#if sessionState.connected}
				<span class="text-emerald-400">Linked to projector</span>
			{:else}
				<span class="text-amber-400">Waiting for projector peer…</span>
			{/if}
			{#if sessionState.calibration?.status === 'ready' || locked}
				<span class="text-emerald-400">Calibration synced</span>
				<button
					type="button"
					class="rounded border border-zinc-600 px-3 py-1 hover:border-amber-500"
					onclick={recalibrate}
				>
					Recalibrate
				</button>
				{#if sessionState.calibration}
					<button
						type="button"
						class="rounded border border-zinc-600 px-3 py-1 hover:border-amber-500"
						onclick={() => sessionState.calibration && downloadCalibration(sessionState.calibration)}
					>
						Export JSON
					</button>
				{/if}
			{/if}
		</div>
	{:else if !joinError}
		<p class="text-sm text-zinc-500">Joining session…</p>
	{/if}

	<details class="rounded-lg border border-zinc-800 p-4">
		<summary class="cursor-pointer text-sm text-zinc-400">Manual calibration import (fallback)</summary>
		<div class="mt-3 flex flex-col gap-2">
			<textarea
				class="h-32 w-full rounded border border-zinc-700 bg-zinc-900 p-2 font-mono text-xs"
				placeholder="Paste calibration JSON…"
				bind:value={importText}
			></textarea>
			{#if importError}
				<p class="text-sm text-red-400">{importError}</p>
			{/if}
			<button
				type="button"
				class="self-start rounded bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
				onclick={handleImport}
			>
				Import &amp; sync
			</button>
		</div>
	</details>
</div>
