<script lang="ts">
	import type { Rect } from '$lib/calibration/gutters';

	let {
		rect,
		visible = true,
		class: className = '',
		children
	}: {
		rect: Rect;
		visible?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
	} = $props();
</script>

{#if visible && rect.width > 4 && rect.height > 4}
	<div
		class="pointer-events-none absolute flex items-center justify-center overflow-hidden {className}"
		style:left="{rect.width + rect.left}px"
		// style:top="{rect.height + rect.top}px"
		// style:width="{rect.width}px"
		// style:height="{rect.height}px"
	>
		<div class="pointer-events-auto max-h-full max-w-full overflow-hidden">
			{@render children?.()}
		</div>
	</div>
{/if}
