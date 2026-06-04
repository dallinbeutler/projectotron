export async function loadImageFile(file: File): Promise<HTMLCanvasElement> {
	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(new Error('Failed to load image'));
			el.src = url;
		});
		const canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas not supported');
		ctx.drawImage(img, 0, 0);
		return canvas;
	} finally {
		URL.revokeObjectURL(url);
	}
}

export function canvasFromImageData(width: number, height: number, source: CanvasImageSource): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas not supported');
	ctx.drawImage(source, 0, 0, width, height);
	return canvas;
}
