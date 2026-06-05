<script lang="ts">
	import { cameraJoinUrl } from '$lib/joinUrl';
	import type { ProjectorLayout } from '$lib/types';

	let {
		sessionCode,
		layout,
		size = 160
	}: {
		sessionCode: string;
		layout?: ProjectorLayout;
		size?: number;
	} = $props();

	let dataUrl = $state('');
	const joinUrl = $derived(cameraJoinUrl(sessionCode, layout));

	$effect(() => {
		const url = joinUrl;
		const qrSize = size;
		let cancelled = false;

		(async () => {
			const QRCode = await import('qrcode');
			try {
				const next = await QRCode.toDataURL(url, {
					margin: 1,
					width: qrSize,
					color: { dark: '#000000', light: '#ffffff' }
				});
				if (!cancelled) dataUrl = next;
			} catch {
				if (!cancelled) dataUrl = '';
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="flex flex-col items-center gap-2 rounded-lg bg-gray-900 p-3 text-black shadow-xl z-50">
	{#if dataUrl}
		<img src={dataUrl} alt="Scan to join camera session" width={size} height={size} class="block" />
	{:else}
		<div
			class="animate-pulse rounded bg-zinc-200"
			style:width="{size}px"
			style:height="{size}px"
		></div>
	{/if}
</div>
<p class="max-w-[180px] text-center text-[10px] leading-tight ">
	Scan to open camera &amp; join session
</p>
