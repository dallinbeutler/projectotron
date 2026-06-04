import PerspT from 'perspective-transform';
import type { MarkerObservation, Point } from '$lib/types';

export type HomographyResult = {
	homography: number[];
	homographyInv: number[];
};

function flattenPoints(points: Point[]): number[] {
	return points.flatMap((p) => [p.x, p.y]);
}

/** Compute homography from projector (src) to camera (dst) using 4+ correspondences. */
export function solveHomography(
	projPoints: Point[],
	camPoints: Point[]
): HomographyResult | null {
	if (projPoints.length < 4 || camPoints.length < 4) return null;
	if (projPoints.length !== camPoints.length) return null;

	const src = flattenPoints(projPoints.slice(0, 4));
	const dst = flattenPoints(camPoints.slice(0, 4));

	try {
		const persp = PerspT(src, dst);
		return {
			homography: [...persp.coeffs],
			homographyInv: [...persp.coeffsInv]
		};
	} catch {
		return null;
	}
}

export function solveFromMarkers(markers: MarkerObservation[]): HomographyResult | null {
	if (markers.length < 4) return null;
	return solveHomography(
		markers.map((m) => m.proj),
		markers.map((m) => m.cam)
	);
}

/** Apply 3×3 homography (9 coeffs, h33=1) to a point. */
export function applyHomography(coeffs: number[], p: Point): Point {
	const [h11, h12, h13, h21, h22, h23, h31, h32] = coeffs;
	const denom = h31 * p.x + h32 * p.y + 1;
	if (Math.abs(denom) < 1e-10) return { x: 0, y: 0 };
	return {
		x: (h11 * p.x + h12 * p.y + h13) / denom,
		y: (h21 * p.x + h22 * p.y + h23) / denom
	};
}

/** Map camera point back to projector space using inverse homography. */
export function cameraToProjector(homographyInv: number[], p: Point): Point {
	return applyHomography(homographyInv, p);
}

/** Map projector point to camera space. */
export function projectorToCamera(homography: number[], p: Point): Point {
	return applyHomography(homography, p);
}
