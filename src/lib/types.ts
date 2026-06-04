export type Point = { x: number; y: number };

export type MarkerObservation = {
	id: number;
	proj: Point;
	cam: Point;
};

export type CalibrationData = {
	homography: number[];
	homographyInv: number[];
	projector: { width: number; height: number };
	markers: MarkerObservation[];
	updatedAt: number;
	status: 'partial' | 'ready';
};

export type FineTuneSettings = {
	rect: { x: number; y: number; width: number; height: number };
	realWidth: number;
	realHeight: number;
	unit: 'in' | 'cm';
	zoom: number;
};

export type SessionRole = 'projector' | 'phone';

/** Projector display size and tag-grid inset (synced to phone for homography). */
export type ProjectorLayout = {
	width: number;
	height: number;
	margin: number;
};

export const DEFAULT_FINE_TUNE: FineTuneSettings = {
	rect: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
	realWidth: 10,
	realHeight: 10,
	unit: 'in',
	zoom: 1
};
