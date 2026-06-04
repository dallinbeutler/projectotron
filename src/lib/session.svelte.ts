import { browser } from '$app/environment';
import type { CalibrationData, FineTuneSettings, ProjectorLayout, SessionRole } from '$lib/types';


export type AppSession = {
	code: string;
	role: SessionRole;
	syncRoom: import('$lib/sync/room').SyncRoom | null;
	connected: boolean;
	peerCount: number;
	calibration: CalibrationData | null;
	fineTune: FineTuneSettings | null;
	projectorLayout: ProjectorLayout | null;
};


/** Session code helpers and JSON import/export (sync uses Trystero in sync/room.ts). */

const SESSION_KEY = 'projectotron-session';

function generateSessionCode(): string {
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



function createSessionState(): AppSession {
	return {
		code: '',
		role: 'projector',
		syncRoom: null,
		connected: false,
		peerCount: 0,
		calibration: null,
		fineTune: null,
		projectorLayout: null
	};
}

export const sessionState = $state<AppSession>(createSessionState());

async function getSyncModule() {
	return import('$lib/sync/room');
}

async function refreshPeerCount(): Promise<void> {
	if (!sessionState.syncRoom) {
		sessionState.peerCount = 0;
		sessionState.connected = false;
		return;
	}
	const { peerCount } = await getSyncModule();
	sessionState.peerCount = peerCount(sessionState.syncRoom.room);
	sessionState.connected = sessionState.peerCount > 0;
}

/** Restore session code from storage without opening a sync room (avoids P2P on every page). */
export function restoreSessionCode(): void {
	const stored = getStoredSession();
	if (!stored) return;
	sessionState.code = stored.code;
	sessionState.role = stored.role;
}

/** Open Trystero room for the current session (idempotent). */
export async function ensureSyncRoom(): Promise<void> {
	if (!browser || !sessionState.code || sessionState.syncRoom) return;

	const { joinSyncRoom } = await getSyncModule();

	if (sessionState.syncRoom) return;

	const syncRoom = joinSyncRoom(sessionState.code, {
		onCalibration: (data) => {
			sessionState.calibration = data;
		},
		onFineTune: (data) => {
			sessionState.fineTune = data;
		},
		onProjectorLayout: (data) => {
			sessionState.projectorLayout = data;
		},
		onPeerJoin: () => {
			void refreshPeerCount();
			// Layout is sent on mount; re-send when a peer joins (Trystero does not replay).
			if (sessionState.role === 'projector' && sessionState.projectorLayout) {
				const layout = sessionState.projectorLayout;
				setTimeout(() => void publishProjectorLayout(layout), 300);
			}
		},
		onPeerLeave: () => {
			void refreshPeerCount();
		}
	});

	sessionState.syncRoom = syncRoom;
	await refreshPeerCount();
}

export async function joinSession(code: string, role: SessionRole): Promise<void> {
	if (!browser) return;
	await leaveSession();

	const normalized = code.toUpperCase();
	sessionState.code = normalized;
	sessionState.role = role;
	storeSession(normalized, role);

	await ensureSyncRoom();
}

export function createAndJoin(role: SessionRole = 'projector'): Promise<void> {
	const code = generateSessionCode();
	return joinSession(code, role);
}

export async function leaveSession(): Promise<void> {
	if (sessionState.syncRoom) {
		const { leaveSyncRoom } = await getSyncModule();
		leaveSyncRoom();
	}
	clearStoredSession();
	Object.assign(sessionState, createSessionState());
}

export async function pushCalibration(data: CalibrationData): Promise<void> {
	await ensureSyncRoom();
	if (!sessionState.syncRoom || !sessionState.code) {
		sessionState.calibration = data;
		return;
	}
	const { publishCalibrationSync } = await getSyncModule();
	publishCalibrationSync(data);
	sessionState.calibration = data;
}

export async function pushFineTune(settings: FineTuneSettings): Promise<void> {
	await ensureSyncRoom();
	if (!sessionState.syncRoom || !sessionState.code) return;
	const { publishFineTuneSync } = await getSyncModule();
	publishFineTuneSync(settings);
	sessionState.fineTune = settings;
}

async function publishProjectorLayout(layout: ProjectorLayout): Promise<void> {
	if (!sessionState.syncRoom || !sessionState.code) return;
	const { publishProjectorLayoutSync } = await getSyncModule();
	publishProjectorLayoutSync(layout);
}

export async function pushProjectorLayout(layout: ProjectorLayout): Promise<void> {
	sessionState.projectorLayout = layout;
	await ensureSyncRoom();
	await publishProjectorLayout(layout);
}

export function downloadCalibration(data: CalibrationData): void {
	const blob = new Blob([exportCalibrationJson(data)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `projectotron-calibration-${sessionState.code || 'export'}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function loadCalibrationFromFile(file: File): Promise<CalibrationData> {
	return file.text().then(importCalibrationJson);
}

export function loadCalibrationFromText(text: string): CalibrationData {
	return importCalibrationJson(text);
}

export function setCalibration(data: CalibrationData): void {
	sessionState.calibration = data;
}

export { generateSessionCode };
