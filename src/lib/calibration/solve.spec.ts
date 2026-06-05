import { describe, expect, it } from 'vitest';
import { applyHomography, solveFromMarkers, solveHomography } from '$lib/calibration/solve';
import type { MarkerObservation } from '$lib/types';

describe('solveHomography', () => {
	it('returns identity-like mapping for aligned squares', () => {
		const square = [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 100 },
			{ x: 0, y: 100 }
		];
		const result = solveHomography(square, square);
		expect(result).not.toBeNull();
		const mapped = applyHomography(result!.homography, { x: 50, y: 50 });
		expect(mapped.x).toBeCloseTo(50, 0);
		expect(mapped.y).toBeCloseTo(50, 0);
	});

	it('maps translated points', () => {
		const src = [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 100 },
			{ x: 0, y: 100 }
		];
		const dst = src.map((p) => ({ x: p.x + 10, y: p.y + 20 }));
		const result = solveHomography(src, dst);
		expect(result).not.toBeNull();
		const mapped = applyHomography(result!.homography, { x: 0, y: 0 });
		expect(mapped.x).toBeCloseTo(10, 0);
		expect(mapped.y).toBeCloseTo(20, 0);
	});

	it('returns null with fewer than 4 points', () => {
		expect(solveHomography([{ x: 0, y: 0 }], [{ x: 1, y: 1 }])).toBeNull();
	});
});

describe('solveFromMarkers', () => {
	it('uses corner marker ids when nine tags are present in arbitrary order', () => {
		const corners: MarkerObservation[] = [
			{ id: 0, proj: { x: 100, y: 100 }, cam: { x: 10, y: 20 } },
			{ id: 2, proj: { x: 900, y: 100 }, cam: { x: 200, y: 25 } },
			{ id: 8, proj: { x: 900, y: 800 }, cam: { x: 210, y: 180 } },
			{ id: 6, proj: { x: 100, y: 800 }, cam: { x: 15, y: 175 } }
		];
		const interior: MarkerObservation[] = [
			{ id: 4, proj: { x: 500, y: 450 }, cam: { x: 100, y: 95 } },
			{ id: 1, proj: { x: 500, y: 100 }, cam: { x: 105, y: 22 } },
			{ id: 3, proj: { x: 100, y: 450 }, cam: { x: 12, y: 98 } },
			{ id: 5, proj: { x: 900, y: 450 }, cam: { x: 205, y: 100 } },
			{ id: 7, proj: { x: 500, y: 800 }, cam: { x: 102, y: 178 } }
		];
		const shuffled = [interior[0], corners[2], interior[1], corners[0], interior[2], interior[3], corners[3], interior[4], corners[1]];
		expect(solveFromMarkers(shuffled)).not.toBeNull();
	});
});
