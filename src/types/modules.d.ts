declare module 'perspective-transform' {
	type PerspTInstance = {
		transform: (x: number, y: number) => number;
		transformInverse: (x: number, y: number) => number;
		coeffs: number[];
		coeffsInv: number[];
		srcPts: number[];
		dstPts: number[];
	};

	function PerspT(srcPts: number[], dstPts: number[]): PerspTInstance;
	export default PerspT;
}

declare module 'gun/gun.js' {
	const Gun: new (opts?: { peers?: string[]; localStorage?: boolean }) => unknown;
	export default Gun;
}
