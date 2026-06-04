import { browser } from '$app/environment';
import type { CalibrationData, FineTuneSettings, SessionRole } from '$lib/types';
import {
	exportCalibrationJson,
	generateSessionCode,
	getStoredSession,
	importCalibrationJson,
	storeSession,
	clearStoredSession
} from '$lib/gun/session';

export type AppSession = {
	code: string;
	role: SessionRole;
	syncRoom: import('$lib/sync/room').SyncRoom | null;
	connected: boolean;
	peerCount: number;
	calibration: CalibrationData | null;
	fineTune: FineTuneSettings | null;
};

function createSessionState(): AppSession {
	return {
		code: '',
		role: 'projector',
		syncRoom: null,
		connected: false,
		peerCount: 0,
		calibration: null,
		fineTune: null
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
		onPeerJoin: () => {
			void refreshPeerCount();
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
