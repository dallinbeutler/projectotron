import type { FineTuneSettings, Point } from '$lib/types';
import { applyHomography } from '$lib/calibration/solve';

/** Combined scale factor from reference rect real-world dimensions and zoom slider. */
export function computeFineTuneScale(
	settings: FineTuneSettings,
	sourceWidth: number,
	_projectorWidth: number
): number {
	const rectPxWidth = settings.rect.width * sourceWidth;
	if (rectPxWidth <= 0 || settings.realWidth <= 0) return settings.zoom;
	const pixelsPerUnit = rectPxWidth / settings.realWidth;
	const baseScale = 1 / pixelsPerUnit;
	// Lower zoom value → larger on fabric; pairs with inverted slider (right = zoom in).
	return baseScale / settings.zoom;
}

export function applyFineTuneToPoint(p: Point, settings: FineTuneSettings, sourceSize: Point): Point {
	const cx = settings.rect.x * sourceSize.x + (settings.rect.width * sourceSize.x) / 2;
	const cy = settings.rect.y * sourceSize.y + (settings.rect.height * sourceSize.y) / 2;
	const scale = computeFineTuneScale(settings, sourceSize.x, sourceSize.x);
	return {
		x: cx + (p.x - cx) * scale,
		y: cy + (p.y - cy) * scale
	};
}

export function mergeFineTuneJson(raw: string, current: FineTuneSettings): FineTuneSettings {
	const parsed = JSON.parse(raw) as Partial<FineTuneSettings>;
	return { ...current, ...parsed };
}

/** Distance between two projector-space points (for scale reference). */
export function distance(a: Point, b: Point): number {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Estimate projector pixels per inch from corner homography edge lengths. */
export function estimatePixelsPerInch(
	cornerProjPoints: Point[],
	cornerCamPoints: Point[],
	homography: number[],
	knownWidthInches: number
): number {
	if (cornerProjPoints.length < 2 || cornerCamPoints.length < 2) return 96;
	const cam0 = applyHomography(homography, cornerProjPoints[0]);
	const cam1 = applyHomography(homography, cornerProjPoints[1]);
	const camSpan = distance(cam0, cam1);
	const projSpan = distance(cornerProjPoints[0], cornerProjPoints[1]);
	if (camSpan <= 0) return 96;
	return (projSpan / camSpan) * knownWidthInches;
}
