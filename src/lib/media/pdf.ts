export async function renderPdfPage(
	file: File,
	pageNumber: number,
	scale = 2
): Promise<HTMLCanvasElement> {
	const pdfjs = await import('pdfjs-dist');
	pdfjs.GlobalWorkerOptions.workerSrc = new URL(
		'pdfjs-dist/build/pdf.worker.min.mjs',
		import.meta.url
	).href;

	const data = new Uint8Array(await file.arrayBuffer());
	const pdf = await pdfjs.getDocument({ data }).promise;
	const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));
	const viewport = page.getViewport({ scale });
	const canvas = document.createElement('canvas');
	canvas.width = viewport.width;
	canvas.height = viewport.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas not supported');
	await page.render({ canvasContext: ctx, viewport, canvas }).promise;
	return canvas;
}

export async function getPdfPageCount(file: File): Promise<number> {
	const pdfjs = await import('pdfjs-dist');
	pdfjs.GlobalWorkerOptions.workerSrc = new URL(
		'pdfjs-dist/build/pdf.worker.min.mjs',
		import.meta.url
	).href;

	const data = new Uint8Array(await file.arrayBuffer());
	const pdf = await pdfjs.getDocument({ data }).promise;
	return pdf.numPages;
}
