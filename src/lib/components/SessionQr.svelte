<script lang="ts">
	import { cameraJoinUrl } from '$lib/joinUrl';
	import { onMount } from 'svelte';

	let {
		sessionCode,
		size = 160
	}: {
		sessionCode: string;
		size?: number;
	} = $props();

	let dataUrl = $state('');
	let joinUrl = $derived(cameraJoinUrl(sessionCode));

	onMount(async () => {
		const QRCode = await import('qrcode');
		try {
			dataUrl = await QRCode.toDataURL(joinUrl, {
				margin: 1,
				width: size,
				color: { dark: '#000000', light: '#ffffff' }
			});
		} catch {
			dataUrl = '';
		}
	});
</script>

<div class="flex flex-col items-center gap-2 rounded-lg bg-white p-3 text-black shadow-lg">
	{#if dataUrl}
		<img src={dataUrl} alt="Scan to join camera session" width={size} height={size} class="block" />
	{:else}
		<div
			class="animate-pulse rounded bg-zinc-200"
			style:width="{size}px"
			style:height="{size}px"
		></div>
	{/if}
	<p class="max-w-[180px] text-center text-[10px] leading-tight text-zinc-600">
		Scan to open camera &amp; join session
	</p>
</div>
