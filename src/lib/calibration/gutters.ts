import {
	CALIBRATION_MARGIN,
	CALIBRATION_MARKERS,
	getMarkerById,
	markerCenterPx,
	tagSizePx
} from '$lib/calibration/pattern';

export type Rect = { left: number; top: number; width: number; height: number };

function markerRect(id: number, width: number, height: number): Rect {
	const marker = getMarkerById(id)!;
	const c = markerCenterPx(marker, width, height);
	const half = tagSizePx(width, height) / 2;
	return { left: c.x - half, top: c.y - half, width: half * 2, height: half * 2 };
}

function horizontalGutter(idLeft: number, idRight: number, width: number, height: number): Rect {
	const a = markerRect(idLeft, width, height);
	const b = markerRect(idRight, width, height);
	return {
		left: a.left + a.width,
		top: Math.min(a.top, b.top),
		width: Math.max(0, b.left - (a.left + a.width)),
		height: Math.max(a.height, b.height)
	};
}

function verticalGutter(idTop: number, idBottom: number, width: number, height: number): Rect {
	const a = markerRect(idTop, width, height);
	const b = markerRect(idBottom, width, height);
	return {
		left: Math.min(a.left, b.left),
		top: a.top + a.height,
		width: Math.max(a.width, b.width),
		height: Math.max(0, b.top - (a.top + a.height))
	};
}

/** Black-band regions between tags and margins — safe for UI overlays. */
export function calibrationGutters(width: number, height: number) {
	const row0 = CALIBRATION_MARKERS.filter((m) => m.row === 0);
	const row2 = CALIBRATION_MARKERS.filter((m) => m.row === 2);
	const topEdge = Math.min(...row0.map((m) => markerRect(m.id, width, height).top));
	const bottomEdge = Math.max(...row2.map((m) => markerRect(m.id, width, height).top + markerRect(m.id, width, height).height));

	const marginX = width * CALIBRATION_MARGIN;
	const marginY = height * CALIBRATION_MARGIN;

	return {
		/** Between tags 0 and 1 (top row). */
		topLeft: horizontalGutter(0, 1, width, height),
		/** Between tags 1 and 2 (top row). */
		topRight: horizontalGutter(1, 2, width, height),
		/** Between tags 3 and 4 (middle row). */
		midLeft: horizontalGutter(3, 4, width, height),
		/** Between tags 4 and 5 (middle row). */
		midRight: horizontalGutter(4, 5, width, height),
		/** Between tags 6 and 7 (bottom row). */
		bottomLeft: horizontalGutter(6, 7, width, height),
		/** Between tags 7 and 8 (bottom row). */
		bottomRight: horizontalGutter(7, 8, width, height),
		/** Between tags 1 and 4 (center column). */
		centerTop: verticalGutter(1, 4, width, height),
		/** Between tags 4 and 7 (center column). */
		centerBottom: verticalGutter(4, 7, width, height),
		/** Between tags 0 and 3 (left column). */
		leftTop: verticalGutter(0, 3, width, height),
		/** Between tags 3 and 6 (left column). */
		leftBottom: verticalGutter(3, 6, width, height),
		/** Between tags 2 and 5 (right column). */
		rightTop: verticalGutter(2, 5, width, height),
		/** Between tags 5 and 8 (right column). */
		rightBottom: verticalGutter(5, 8, width, height),
		/** Full-width strip above the top tag row. */
		topBar: {
			left: marginX * 0.5,
			top: 0,
			width: width - marginX,
			height: Math.max(0, topEdge)
		},
		/** Full-width strip below the bottom tag row. */
		bottomBar: {
			left: marginX * 0.5,
			top: bottomEdge,
			width: width - marginX,
			height: Math.max(0, height - bottomEdge - marginY * 0.5)
		},
		/** Left margin strip beside the tag grid. */
		leftBar: {
			left: 0,
			top: marginY,
			width: marginX,
			height: height - marginY * 2
		},
		/** Right margin strip beside the tag grid. */
		rightBar: {
			left: width - marginX,
			top: marginY,
			width: marginX,
			height: height - marginY * 2
		}
	};
}

/** Pick the largest gutter that fits minimum dimensions. */
export function bestGutterFor(
	gutters: ReturnType<typeof calibrationGutters>,
	minWidth: number,
	minHeight: number,
	prefer: (keyof ReturnType<typeof calibrationGutters>)[] = []
): Rect | null {
	const keys = prefer.length
		? prefer
		: (Object.keys(gutters) as (keyof ReturnType<typeof calibrationGutters>)[]);
	let best: Rect | null = null;
	let bestArea = 0;
	for (const key of keys) {
		const g = gutters[key];
		if (g.width >= minWidth && g.height >= minHeight) {
			const area = g.width * g.height;
			if (area > bestArea) {
				bestArea = area;
				best = g;
			}
		}
	}
	return best;
}
