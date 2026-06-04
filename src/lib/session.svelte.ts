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
import {
	joinSyncRoom,
	leaveSyncRoom,
	peerCount,
	publishCalibrationSync,
	publishFineTuneSync,
	type SyncRoom
} from '$lib/sync/room';

export type AppSession = {
	code: string;
	role: SessionRole;
	syncRoom: SyncRoom | null;
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

function updateConnectionState(): void {
	const count = peerCount(sessionState.syncRoom?.room ?? null);
	sessionState.peerCount = count;
	sessionState.connected = count > 0;
}

export async function joinSession(code: string, role: SessionRole): Promise<void> {
	if (!browser) return;
	await leaveSession();

	const normalized = code.toUpperCase();
	const syncRoom = joinSyncRoom(normalized, {
		onCalibration: (data) => {
			sessionState.calibration = data;
		},
		onFineTune: (data) => {
			sessionState.fineTune = data;
		},
		onPeerJoin: () => updateConnectionState(),
		onPeerLeave: () => updateConnectionState()
	});

	sessionState.code = normalized;
	sessionState.role = role;
	sessionState.syncRoom = syncRoom;
	storeSession(normalized, role);

	// Room is active immediately; peers appear when the other device joins
	updateConnectionState();
}

export function createAndJoin(role: SessionRole = 'projector'): Promise<void> {
	const code = generateSessionCode();
	return joinSession(code, role);
}

export function leaveSession(): void {
	leaveSyncRoom();
	clearStoredSession();
	Object.assign(sessionState, createSessionState());
}

export async function pushCalibration(data: CalibrationData): Promise<void> {
	if (!sessionState.syncRoom || !sessionState.code) {
		sessionState.calibration = data;
		return;
	}
	publishCalibrationSync(data);
	sessionState.calibration = data;
}

export async function pushFineTune(settings: FineTuneSettings): Promise<void> {
	if (!sessionState.syncRoom || !sessionState.code) return;
	publishFineTuneSync(settings);
	sessionState.fineTune = settings;
}

export function restoreSession(): Promise<void> | null {
	const stored = getStoredSession();
	if (!stored) return null;
	return joinSession(stored.code, stored.role);
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
