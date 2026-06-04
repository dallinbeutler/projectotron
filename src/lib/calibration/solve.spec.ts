import { describe, expect, it } from 'vitest';
import { applyHomography, solveHomography } from '$lib/calibration/solve';

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
