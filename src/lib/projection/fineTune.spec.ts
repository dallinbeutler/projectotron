import { describe, expect, it } from 'vitest';
import { computeFineTuneScale, applyFineTuneToPoint } from '$lib/projection/fineTune';
import { DEFAULT_FINE_TUNE } from '$lib/types';

describe('fineTune', () => {
	it('computes scale from real dimensions', () => {
		const settings = {
			...DEFAULT_FINE_TUNE,
			rect: { x: 0, y: 0, width: 0.5, height: 0.5 },
			realWidth: 10,
			zoom: 1
		};
		const scale = computeFineTuneScale(settings, 1000, 1920);
		expect(scale).toBeGreaterThan(0);
	});

	it('scales points about rect center', () => {
		const settings = {
			...DEFAULT_FINE_TUNE,
			rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
			realWidth: 10,
			realHeight: 10,
			zoom: 2
		};
		const sourceSize = { x: 1000, y: 800 };
		const center = applyFineTuneToPoint({ x: 500, y: 400 }, settings, sourceSize);
		expect(center.x).toBeCloseTo(500, 0);
		expect(center.y).toBeCloseTo(400, 0);
	});
});
