import { base } from '$app/paths';
import type { ProjectorLayout } from '$lib/types';

/** Full URL for a phone to open camera mode and join a session (for QR codes). */
export function cameraJoinUrl(sessionCode: string, layout?: ProjectorLayout): string {
	const params = new URLSearchParams();
	params.set('session', sessionCode.toUpperCase());
	if (layout && layout.width > 0 && layout.height > 0) {
		params.set('w', String(Math.round(layout.width)));
		params.set('h', String(Math.round(layout.height)));
		params.set('m', String(layout.margin));
	}
	const query = params.toString();
	if (typeof window !== 'undefined') {
		return `${window.location.origin}${base}/camera/?${query}`;
	}
	return `${base}/camera/?${query}`;
}

export function sessionFromSearchParams(params: URLSearchParams): string | null {
	const session = params.get('session')?.trim().toUpperCase();
	if (session && /^[A-Z0-9]{6}$/.test(session)) return session;
	return null;
}

export function layoutFromSearchParams(params: URLSearchParams): ProjectorLayout | null {
	const w = Number(params.get('w'));
	const h = Number(params.get('h'));
	const m = Number(params.get('m'));
	if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(m)) return null;
	if (w <= 0 || h <= 0 || m <= 0 || m >= 0.5) return null;
	return { width: w, height: h, margin: m };
}
