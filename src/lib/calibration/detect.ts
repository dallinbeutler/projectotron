import { base } from '$app/paths';

export type AprilTagDetection = {
	id: number;
	center: { x: number; y: number };
	corners: Array<{ x: number; y: number }>;
};

type ApriltagModule = {
	detect: (grayscale: Uint8Array, width: number, height: number) => AprilTagDetection[];
	set_return_pose: (v: number) => void;
};

let detector: ApriltagModule | null = null;
let loading: Promise<ApriltagModule> | null = null;

async function loadWasmScript(): Promise<void> {
	const wasmUrl = `${base}/apriltag/apriltag_wasm.js`;
	await new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = wasmUrl;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load AprilTag WASM'));
		document.head.appendChild(script);
	});
}

class BrowserApriltag implements ApriltagModule {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private Module: any;
	private _init: () => number;
	private _destroy: () => number;
	private _set_detector_options: (...args: number[]) => number;
	private _set_img_buffer: (w: number, h: number, stride: number) => number;
	private _detect: () => number;

	constructor(Module: unknown) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.Module = Module as any;
		this._init = this.Module.cwrap('atagjs_init', 'number', []);
		this._destroy = this.Module.cwrap('atagjs_destroy', 'number', []);
		this._set_detector_options = this.Module.cwrap('atagjs_set_detector_options', 'number', [
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number'
		]);
		this._set_img_buffer = this.Module.cwrap('atagjs_set_img_buffer', 'number', [
			'number',
			'number',
			'number'
		]);
		this._detect = this.Module.cwrap('atagjs_detect', 'number', []);
		this._init();
		this.set_return_pose(0);
		this._set_detector_options(2.0, 0.0, 1, 1, 0, 0, 0);
	}

	set_return_pose(v: number): void {
		this._set_detector_options(2.0, 0.0, 1, 1, 0, v, 0);
	}

	detect(grayscale: Uint8Array, width: number, height: number): AprilTagDetection[] {
		const imgBuffer = this._set_img_buffer(width, height, width);
		this.Module.HEAPU8.set(grayscale, imgBuffer);
		const strJsonPtr = this._detect();
		const strJsonLen = this.Module.getValue(strJsonPtr, 'i32');
		if (strJsonLen === 0) return [];

		const strJsonStrPtr = this.Module.getValue(strJsonPtr + 4, 'i32');
		const strJsonView = new Uint8Array(this.Module.HEAP8.buffer, strJsonStrPtr, strJsonLen);
		let detectionsJson = '';
		for (let i = 0; i < strJsonLen; i++) {
			detectionsJson += String.fromCharCode(strJsonView[i]);
		}

		try {
			const raw = JSON.parse(detectionsJson) as
				| Array<{
						id: number;
						center?: { x: number; y: number };
						corners?: Array<{ x: number; y: number }>;
				  }>
				| { error?: string };

			if (!Array.isArray(raw)) return [];

			return raw.map((d) => ({
				id: d.id,
				center: d.center ?? { x: 0, y: 0 },
				corners: d.corners ?? []
			}));
		} catch {
			return [];
		}
	}
}

export async function getAprilTagDetector(): Promise<ApriltagModule> {
	if (detector) return detector;
	if (!loading) {
		loading = (async () => {
			await loadWasmScript();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const AprilTagWasm = (window as any).AprilTagWasm;
			if (!AprilTagWasm) throw new Error('AprilTagWasm not found');
			const wasmBase = `${base}/apriltag/`;
			const Module = await AprilTagWasm({
				locateFile: (path: string) => wasmBase + path
			});
			detector = new BrowserApriltag(Module);
			return detector;
		})();
	}
	return loading;
}

export function frameToGrayscale(
	imageData: ImageData,
	maxWidth = 960
): { gray: Uint8Array; width: number; height: number; scale: number } {
	const { width, height, data } = imageData;
	const scale = width > maxWidth ? maxWidth / width : 1;
	const outW = Math.round(width * scale);
	const outH = Math.round(height * scale);
	const gray = new Uint8Array(outW * outH);

	for (let y = 0; y < outH; y++) {
		for (let x = 0; x < outW; x++) {
			const sx = Math.min(width - 1, Math.floor(x / scale));
			const sy = Math.min(height - 1, Math.floor(y / scale));
			const i = (sy * width + sx) * 4;
			gray[y * outW + x] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
		}
	}

	return { gray, width: outW, height: outH, scale };
}

export function detectionToCameraPoint(
	detection: AprilTagDetection,
	scale: number
): { x: number; y: number } {
	return {
		x: detection.center.x / scale,
		y: detection.center.y / scale
	};
}
