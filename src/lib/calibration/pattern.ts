import type { Point } from '$lib/types';
import { base } from '$app/paths';

/** Fraction of viewport reserved as margin around the tag grid. */
export const CALIBRATION_MARGIN = 0.08;

/** Tag edge length as a fraction of the shorter viewport side. */
export const TAG_SIZE_FRACTION = 0.12;

export type CalibrationMarker = {
	id: number;
	/** Normalized center position in projector space (0–1). */
	normCenter: Point;
	/** Grid row/col for layout (0–2). */
	row: number;
	col: number;
};

/** 3×3 grid of tag36h11 IDs 0–8. */
export const CALIBRATION_MARKERS: CalibrationMarker[] = [
	{ id: 0, normCenter: { x: 0, y: 0 }, row: 0, col: 0 },
	{ id: 1, normCenter: { x: 0.5, y: 0 }, row: 0, col: 1 },
	{ id: 2, normCenter: { x: 1, y: 0 }, row: 0, col: 2 },
	{ id: 3, normCenter: { x: 0, y: 0.5 }, row: 1, col: 0 },
	{ id: 4, normCenter: { x: 0.5, y: 0.5 }, row: 1, col: 1 },
	{ id: 5, normCenter: { x: 1, y: 0.5 }, row: 1, col: 2 },
	{ id: 6, normCenter: { x: 0, y: 1 }, row: 2, col: 0 },
	{ id: 7, normCenter: { x: 0.5, y: 1 }, row: 2, col: 1 },
	{ id: 8, normCenter: { x: 1, y: 1 }, row: 2, col: 2 }
];

export function tagImageUrl(id: number): string {
	return `${base}/tags/tag36_11_${String(id).padStart(5, '0')}.png`;
}

export function projectorSize(): { width: number; height: number } {
	return {
		width: typeof window !== 'undefined' ? window.innerWidth : 1920,
		height: typeof window !== 'undefined' ? window.innerHeight : 1080
	};
}

/** Map normalized grid position to pixel center in projector space. */
export function markerCenterPx(marker: CalibrationMarker, width: number, height: number): Point {
	const innerW = width * (1 - 2 * CALIBRATION_MARGIN);
	const innerH = height * (1 - 2 * CALIBRATION_MARGIN);
	const x = width * CALIBRATION_MARGIN + marker.normCenter.x * innerW;
	const y = height * CALIBRATION_MARGIN + marker.normCenter.y * innerH;
	return { x, y };
}

export function tagSizePx(width: number, height: number): number {
	return Math.min(width, height) * TAG_SIZE_FRACTION;
}

export function getMarkerById(id: number): CalibrationMarker | undefined {
	return CALIBRATION_MARKERS.find((m) => m.id === id);
}

/** Corner marker IDs for homography (top-left, top-right, bottom-right, bottom-left). */
export const CORNER_MARKER_IDS = [0, 2, 8, 6] as const;

export function cornerProjectorPoints(width: number, height: number): Point[] {
	return CORNER_MARKER_IDS.map((id) => {
		const marker = getMarkerById(id)!;
		return markerCenterPx(marker, width, height);
	});
}
