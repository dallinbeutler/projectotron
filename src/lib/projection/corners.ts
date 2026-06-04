import type { CalibrationData, Point } from '$lib/types';
import { CORNER_MARKER_IDS } from '$lib/calibration/pattern';

/** Scale calibrated projector corner points to the current display size. */
export function projCornersFromCalibration(
	calibration: CalibrationData,
	width: number,
	height: number
): Point[] {
	const sx = width / calibration.projector.width;
	const sy = height / calibration.projector.height;

	return CORNER_MARKER_IDS.map((id) => {
		const marker = calibration.markers.find((m) => m.id === id);
		if (marker) {
			return { x: marker.proj.x * sx, y: marker.proj.y * sy };
		}
		// fallback: margin grid
		const margin = 0.08;
		const innerW = width * (1 - 2 * margin);
		const innerH = height * (1 - 2 * margin);
		const positions: Record<number, Point> = {
			0: { x: width * margin, y: height * margin },
			2: { x: width * margin + innerW, y: height * margin },
			8: { x: width * margin + innerW, y: height * margin + innerH },
			6: { x: width * margin, y: height * margin + innerH }
		};
		return positions[id];
	});
}
