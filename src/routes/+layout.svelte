<script lang="ts">
	import { base } from '$app/paths';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { restoreSession, sessionState } from '$lib/session.svelte';

	let { children } = $props();

	onMount(() => {
		restoreSession();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Projectotron</title>
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-zinc-100">
	<header class="border-b border-zinc-800 px-4 py-3">
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-4">
			<a href="{base}/" class="text-lg font-semibold tracking-tight text-amber-400">Projectotron</a>
			{#if sessionState.code}
				<div class="flex items-center gap-3 text-xs text-zinc-500">
					<span class="font-mono text-zinc-300">{sessionState.code}</span>
					<span class="rounded-full bg-zinc-800 px-2 py-0.5 capitalize">{sessionState.role}</span>
					{#if sessionState.connected}
						<span class="text-emerald-500">● synced</span>
					{:else}
						<span class="text-zinc-600">○ offline</span>
					{/if}
					{#if sessionState.calibration?.status === 'ready'}
						<span class="text-emerald-400">calibrated</span>
					{/if}
				</div>
			{/if}
		</div>
	</header>
	<main>{@render children()}</main>
</div>
