<script lang="ts">
	import { base } from '$app/paths';

	const STORAGE_KEY = 'projectotron-help-dismissed';

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	function dismiss() {
		open = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, '1');
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="usage-help-title"
	>
		<div class="max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
			<h2 id="usage-help-title" class="mb-3 text-lg font-semibold text-amber-400">
				How to use Projectotron
			</h2>
			<ol class="list-inside list-decimal space-y-2 text-sm text-zinc-300">
				<li>
					Keep this calibration screen fullscreen on the projector. Toggle overlays off while the
					phone scans tags.
				</li>
				<li>Scan the QR code (when overlays are on) to open the camera page on your phone.</li>
				<li>Point the phone at all nine tags until calibration locks.</li>
				<li>
					Open
					<a href="{base}/reproject/" class="text-amber-400 underline hover:text-amber-300"
						>Reprojection</a
					>, upload your pattern, and fine-tune scale.
				</li>
			</ol>
			<p class="mt-4 text-xs text-zinc-500">
				Hide overlays with the corner button so tags stay unobstructed. Press
				<kbd class="rounded bg-zinc-800 px-1">?</kbd> or use Help to show this again.
			</p>
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
					onclick={dismiss}
				>
					Got it
				</button>
			</div>
		</div>
	</div>
{/if}
