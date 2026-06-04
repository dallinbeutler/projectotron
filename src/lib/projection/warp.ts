/**
 * Pre-warp source image onto projector canvas using a source-rect → projector-quad mapping.
 */
import PerspT from 'perspective-transform';
import type { FineTuneSettings, Point } from '$lib/types';
import { applyFineTuneToPoint } from '$lib/projection/fineTune';

export type WarpOptions = {
	sourceCanvas: HTMLCanvasElement;
	outputCanvas: HTMLCanvasElement;
	projCorners: Point[];
	fineTune?: FineTuneSettings;
};

function applyMatrix(coeffs: number[], p: Point): Point {
	const [h11, h12, h13, h21, h22, h23, h31, h32] = coeffs;
	const denom = h31 * p.x + h32 * p.y + 1;
	if (Math.abs(denom) < 1e-10) return { x: -1, y: -1 };
	return {
		x: (h11 * p.x + h12 * p.y + h13) / denom,
		y: (h21 * p.x + h22 * p.y + h23) / denom
	};
}

function bilinearSample(
	data: Uint8ClampedArray,
	width: number,
	height: number,
	x: number,
	y: number
): [number, number, number, number] {
	const x0 = Math.max(0, Math.floor(x));
	const y0 = Math.max(0, Math.floor(y));
	const x1 = Math.min(x0 + 1, width - 1);
	const y1 = Math.min(y0 + 1, height - 1);
	const fx = x - x0;
	const fy = y - y0;

	function px(ix: number, iy: number): [number, number, number, number] {
		const i = (iy * width + ix) * 4;
		return [data[i], data[i + 1], data[i + 2], data[i + 3]];
	}

	const c00 = px(x0, y0);
	const c10 = px(x1, y0);
	const c01 = px(x0, y1);
	const c11 = px(x1, y1);

	const out: [number, number, number, number] = [0, 0, 0, 0];
	for (let c = 0; c < 4; c++) {
		const top = c00[c] * (1 - fx) + c10[c] * fx;
		const bot = c01[c] * (1 - fx) + c11[c] * fx;
		out[c] = Math.round(top * (1 - fy) + bot * fy);
	}
	return out;
}

function drawTexturedTriangle(
	ctx: CanvasRenderingContext2D,
	source: HTMLCanvasElement,
	s0: Point,
	s1: Point,
	s2: Point,
	d0: Point,
	d1: Point,
	d2: Point
): void {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(d0.x, d0.y);
	ctx.lineTo(d1.x, d1.y);
	ctx.lineTo(d2.x, d2.y);
	ctx.closePath();
	ctx.clip();

	const denom = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
	if (Math.abs(denom) < 1e-6) {
		ctx.restore();
		return;
	}

	const m11 = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / denom;
	const m12 = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / denom;
	const m21 = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / denom;
	const m22 = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / denom;
	const dx = d0.x - m11 * s0.x - m12 * s0.y;
	const dy = d0.y - m21 * s0.x - m22 * s0.y;

	ctx.setTransform(m11, m21, m12, m22, dx, dy);
	ctx.drawImage(source, 0, 0);
	ctx.restore();
}

/** Fast triangle-based warp (default for reprojection). */
export function warpToProjectorFast(options: WarpOptions): void {
	const { sourceCanvas, outputCanvas, projCorners, fineTune } = options;
	const sw = sourceCanvas.width;
	const sh = sourceCanvas.height;
	const ow = outputCanvas.width;
	const oh = outputCanvas.height;
	const outCtx = outputCanvas.getContext('2d');
	if (!outCtx) return;

	outCtx.fillStyle = '#000';
	outCtx.fillRect(0, 0, ow, oh);

	const srcCorners: Point[] = [
		{ x: 0, y: 0 },
		{ x: sw, y: 0 },
		{ x: sw, y: sh },
		{ x: 0, y: sh }
	];

	let adjustedSrc = srcCorners;
	if (fineTune) {
		const sourceSize = { x: sw, y: sh };
		adjustedSrc = srcCorners.map((p) => applyFineTuneToPoint(p, fineTune, sourceSize));
	}

	drawTexturedTriangle(
		outCtx,
		sourceCanvas,
		adjustedSrc[0],
		adjustedSrc[1],
		adjustedSrc[2],
		projCorners[0],
		projCorners[1],
		projCorners[2]
	);
	drawTexturedTriangle(
		outCtx,
		sourceCanvas,
		adjustedSrc[0],
		adjustedSrc[2],
		adjustedSrc[3],
		projCorners[0],
		projCorners[2],
		projCorners[3]
	);
}

/** CPU bilinear warp (higher quality, slower). */
export function warpToProjector(options: WarpOptions): void {
	const { sourceCanvas, outputCanvas, projCorners, fineTune } = options;
	const sw = sourceCanvas.width;
	const sh = sourceCanvas.height;
	const ow = outputCanvas.width;
	const oh = outputCanvas.height;

	const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
	const outCtx = outputCanvas.getContext('2d');
	if (!srcCtx || !outCtx) return;

	const srcData = srcCtx.getImageData(0, 0, sw, sh);
	const outData = outCtx.createImageData(ow, oh);

	const srcCorners: Point[] = [
		{ x: 0, y: 0 },
		{ x: sw, y: 0 },
		{ x: sw, y: sh },
		{ x: 0, y: sh }
	];

	let adjustedSrc = srcCorners;
	if (fineTune) {
		const sourceSize = { x: sw, y: sh };
		adjustedSrc = srcCorners.map((p) => applyFineTuneToPoint(p, fineTune, sourceSize));
	}

	const projToSrc = PerspT(
		projCorners.flatMap((p) => [p.x, p.y]),
		adjustedSrc.flatMap((p) => [p.x, p.y])
	);

	for (let y = 0; y < oh; y++) {
		for (let x = 0; x < ow; x++) {
			const sp = applyMatrix(projToSrc.coeffs, { x, y });
			const oi = (y * ow + x) * 4;
			if (sp.x >= 0 && sp.x < sw - 1 && sp.y >= 0 && sp.y < sh - 1) {
				const [r, g, b, a] = bilinearSample(srcData.data, sw, sh, sp.x, sp.y);
				outData.data[oi] = r;
				outData.data[oi + 1] = g;
				outData.data[oi + 2] = b;
				outData.data[oi + 3] = a;
			} else {
				outData.data[oi] = 0;
				outData.data[oi + 1] = 0;
				outData.data[oi + 2] = 0;
				outData.data[oi + 3] = 255;
			}
		}
	}

	outCtx.putImageData(outData, 0, 0);
}
