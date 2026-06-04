import type { Point } from '$lib/types';

/** 3×3 homography as 9 coeffs [h11,h12,h13,h21,h22,h23,h31,h32,h33] with h33=1 */
export type HomographyCoeffs = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number
];

function solveLinear8(A: number[][], b: number[]): number[] | null {
	const n = 8;
	const m = A.map((row, i) => [...row, b[i]]);

	for (let col = 0; col < n; col++) {
		let pivot = col;
		for (let row = col + 1; row < n; row++) {
			if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
		}
		if (Math.abs(m[pivot][col]) < 1e-12) return null;
		[m[col], m[pivot]] = [m[pivot], m[col]];

		for (let row = col + 1; row < n; row++) {
			const factor = m[row][col] / m[col][col];
			for (let j = col; j <= n; j++) {
				m[row][j] -= factor * m[col][j];
			}
		}
	}

	const x = new Array<number>(n);
	for (let row = n - 1; row >= 0; row--) {
		let sum = m[row][n];
		for (let col = row + 1; col < n; col++) {
			sum -= m[row][col] * x[col];
		}
		x[row] = sum / m[row][row];
	}
	return x;
}

/** DLT homography mapping src → dst (4 point correspondences). */
export function homographyFrom4Points(src: Point[], dst: Point[]): HomographyCoeffs | null {
	if (src.length < 4 || dst.length < 4) return null;

	const A: number[][] = [];
	const b: number[] = [];

	for (let i = 0; i < 4; i++) {
		const { x, y } = src[i];
		const { x: u, y: v } = dst[i];
		A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
		b.push(u);
		A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
		b.push(v);
	}

	const h = solveLinear8(A, b);
	if (!h) return null;

	return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

export function invertHomography(h: HomographyCoeffs): HomographyCoeffs | null {
	const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = h;
	const det =
		h11 * (h22 * h33 - h23 * h32) -
		h12 * (h21 * h33 - h23 * h31) +
		h13 * (h21 * h32 - h22 * h31);
	if (Math.abs(det) < 1e-12) return null;

	const invDet = 1 / det;
	return [
		(h22 * h33 - h23 * h32) * invDet,
		(h13 * h32 - h12 * h33) * invDet,
		(h12 * h23 - h13 * h22) * invDet,
		(h23 * h31 - h21 * h33) * invDet,
		(h11 * h33 - h13 * h31) * invDet,
		(h13 * h21 - h11 * h23) * invDet,
		(h21 * h32 - h22 * h31) * invDet,
		(h12 * h31 - h11 * h32) * invDet,
		(h11 * h22 - h12 * h21) * invDet
	];
}

export function applyHomographyCoeffs(h: HomographyCoeffs, p: Point): Point {
	const [h11, h12, h13, h21, h22, h23, h31, h32, h33] = h;
	const denom = h31 * p.x + h32 * p.y + h33;
	if (Math.abs(denom) < 1e-10) return { x: 0, y: 0 };
	return {
		x: (h11 * p.x + h12 * p.y + h13) / denom,
		y: (h21 * p.x + h22 * p.y + h23) / denom
	};
}
