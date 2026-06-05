<script lang="ts">
  // purpose of this component is, when the user wishes to adjust the pattern
	// scale, to provide this transparent overlay to drag over a known-size
	// reference on the pattern and enter the real-world dimensions of the reference
	// this, when confirmed, rescales the image on the corrected projection canvas
	import type { FineTuneSettings } from '$lib/types';

	let {
		settings = $bindable(),
		showPreview = true,
		showFields = true,
		fill = false,
		previewWidth = 400,
		previewHeight = 300
	}: {
		settings: FineTuneSettings;
		showPreview?: boolean;
		showFields?: boolean;
		fill?: boolean;
		previewWidth?: number;
		previewHeight?: number;
	} = $props();

	type DragMode = 'move' | 'resize-se' | null;
	let dragMode = $state<DragMode>(null);
	let dragStart = $state({ x: 0, y: 0 });
	let rectStart = $state({ x: 0, y: 0, width: 0, height: 0 });

	function toNorm(clientX: number, clientY: number, el: HTMLElement) {
		const r = el.getBoundingClientRect();
		return {
			x: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
			y: Math.max(0, Math.min(1, (clientY - r.top) / r.height))
		};
	}

	function onPointerDown(e: PointerEvent, mode: DragMode) {
		const el = e.currentTarget as HTMLElement;
		el.setPointerCapture(e.pointerId);
		dragMode = mode;
		dragStart = { x: e.clientX, y: e.clientY };
		rectStart = { ...settings.rect };
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragMode) return;
		const container = (e.currentTarget as HTMLElement).closest('[data-preview]') as HTMLElement;
		if (!container) return;
		const cur = toNorm(e.clientX, e.clientY, container);
		const start = toNorm(dragStart.x, dragStart.y, container);
		const dx = cur.x - start.x;
		const dy = cur.y - start.y;

		if (dragMode === 'move') {
			settings.rect = {
				...settings.rect,
				x: Math.max(0, Math.min(1 - rectStart.width, rectStart.x + dx)),
				y: Math.max(0, Math.min(1 - rectStart.height, rectStart.y + dy))
			};
		} else if (dragMode === 'resize-se') {
			settings.rect = {
				...settings.rect,
				width: Math.max(0.05, Math.min(1 - rectStart.x, rectStart.width + dx)),
				height: Math.max(0.05, Math.min(1 - rectStart.y, rectStart.height + dy))
			};
		}
	}

	function onPointerUp(e: PointerEvent) {
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		dragMode = null;
	}
</script>

<div class="flex flex-col gap-3">
	{#if showPreview}
		{#if showFields}
			<p class="text-xs text-zinc-500">
				Drag the rectangle over a known-size reference on your pattern, then enter its real dimensions.
			</p>
		{/if}
		<div
			data-preview
			role="application"
			aria-label="Reference rectangle on pattern"
			class="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 {fill
				? 'h-full w-full'
				: ''}"
			style:width={fill ? undefined : `${previewWidth}px`}
			style:height={fill ? undefined : `${previewHeight}px`}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
		>
			<div
				class="absolute border-2 border-amber-400 bg-amber-400/10"
				style:left="{settings.rect.x * 100}%"
				style:top="{settings.rect.y * 100}%"
				style:width="{settings.rect.width * 100}%"
				style:height="{settings.rect.height * 100}%"
			>
				<button
					type="button"
					class="absolute inset-0 cursor-move"
					aria-label="Move reference rectangle"
					onpointerdown={(e) => onPointerDown(e, 'move')}
				></button>
				<button
					type="button"
					class="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize rounded-sm bg-amber-400"
					aria-label="Resize reference rectangle"
					onpointerdown={(e) => {
						e.stopPropagation();
						onPointerDown(e, 'resize-se');
					}}
				></button>
			</div>
		</div>
	{/if}

	{#if showFields}
		<div class="grid grid-cols-2 gap-3">
			<label class="flex flex-col gap-1 text-xs text-zinc-400">
				Width
				<input
					type="number"
					min="0.1"
					step="0.1"
					class="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
					bind:value={settings.realWidth}
				/>
			</label>
			<label class="flex flex-col gap-1 text-xs text-zinc-400">
				Height
				<input
					type="number"
					min="0.1"
					step="0.1"
					class="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
					bind:value={settings.realHeight}
				/>
			</label>
		</div>

		<label class="flex flex-col gap-1 text-xs text-zinc-400">
			Unit
			<select
				class="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
				bind:value={settings.unit}
			>
				<option value="in">inches</option>
				<option value="cm">cm</option>
			</select>
		</label>
	{/if}
</div>
