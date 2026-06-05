import { CALIBRATION_MARKERS } from '$lib/calibration/pattern';
import type { MarkerObservation } from '$lib/types';

const REQUIRED_IDS = CALIBRATION_MARKERS.map((m) => m.id);

/** One observation per calibration id (last wins). */
export function uniqueCalibrationMarkers(markers: MarkerObservation[]): MarkerObservation[] {
	const byId = new Map<number, MarkerObservation>();
	for (const m of markers) {
		if (REQUIRED_IDS.includes(m.id)) byId.set(m.id, m);
	}
	return [...byId.values()];
}

export function allCalibrationTagsMatched(markers: MarkerObservation[]): boolean {
	const unique = uniqueCalibrationMarkers(markers);
	return REQUIRED_IDS.every((id) => unique.some((m) => m.id === id));
}
