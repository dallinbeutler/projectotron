import {
	applyHomographyCoeffs,
	homographyFrom4Points,
	invertHomography,
	type HomographyCoeffs
} from '$lib/calibration/homography';
import { CORNER_MARKER_IDS } from '$lib/calibration/pattern';
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

/** Prefer quad corner markers (0, 2, 8, 6); fall back to any four matches. */
export function solveFromMarkers(markers: MarkerObservation[]): HomographyResult | null {
	const byId = new Map(markers.map((m) => [m.id, m]));
	const corners = CORNER_MARKER_IDS.map((id) => byId.get(id)).filter(
		(m): m is MarkerObservation => m !== undefined
	);
	if (corners.length === 4) {
		return solveHomography(
			corners.map((m) => m.proj),
			corners.map((m) => m.cam)
		);
	}
	if (markers.length < 4) return null;
	return solveHomography(
		markers.slice(0, 4).map((m) => m.proj),
		markers.slice(0, 4).map((m) => m.cam)
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
