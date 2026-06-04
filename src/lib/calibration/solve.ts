import {
	applyHomographyCoeffs,
	homographyFrom4Points,
	invertHomography,
	type HomographyCoeffs
} from '$lib/calibration/homography';
import type { MarkerObservation, Point } from '$lib/types';

export type HomographyResult = {
	homography: number[];
	homographyInv: number[];
};

/** Compute homography from projector (src) to camera (dst) using 4+ correspondences. */
export function solveHomography(
	projPoints: Point[],
	camPoints: Point[]
): HomographyResult | null {
	if (projPoints.length < 4 || camPoints.length < 4) return null;
	if (projPoints.length !== camPoints.length) return null;

	const H = homographyFrom4Points(projPoints.slice(0, 4), camPoints.slice(0, 4));
	if (!H) return null;
	const Hinv = invertHomography(H);
	if (!Hinv) return null;

	return {
		homography: [...H],
		homographyInv: [...Hinv]
	};
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
	return applyHomographyCoeffs(coeffs as HomographyCoeffs, p);
}

export function cameraToProjector(homographyInv: number[], p: Point): Point {
	return applyHomography(homographyInv, p);
}

export function projectorToCamera(homography: number[], p: Point): Point {
	return applyHomography(homography, p);
}
