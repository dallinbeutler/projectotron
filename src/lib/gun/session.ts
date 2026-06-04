import type { CalibrationData, FineTuneSettings, SessionRole } from '$lib/types';

/** Session code helpers and JSON import/export (sync uses Trystero in sync/room.ts). */

const SESSION_KEY = 'projectotron-session';

export function generateSessionCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export function getStoredSession(): { code: string; role: SessionRole } | null {
	if (typeof sessionStorage === 'undefined') return null;
	const raw = sessionStorage.getItem(SESSION_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as { code: string; role: SessionRole };
	} catch {
		return null;
	}
}

export function storeSession(code: string, role: SessionRole): void {
	sessionStorage.setItem(SESSION_KEY, JSON.stringify({ code, role }));
}

export function clearStoredSession(): void {
	sessionStorage.removeItem(SESSION_KEY);
}

export function exportCalibrationJson(data: CalibrationData): string {
	return JSON.stringify(data, null, 2);
}

export function importCalibrationJson(raw: string): CalibrationData {
	const parsed = JSON.parse(raw) as CalibrationData;
	if (!parsed.homography || !parsed.homographyInv || !parsed.projector) {
		throw new Error('Invalid calibration JSON');
	}
	return parsed;
}
