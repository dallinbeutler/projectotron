import { browser } from '$app/environment';
import type { CalibrationData, FineTuneSettings, SessionRole } from '$lib/types';
import {
	exportCalibrationJson,
	generateSessionCode,
	getStoredSession,
	importCalibrationJson,
	initGun,
	pingSession,
	publishCalibration,
	publishFineTune,
	storeSession,
	subscribeCalibration,
	subscribeFineTune,
	subscribePresence,
	type GunChain
} from '$lib/gun/session';

export type AppSession = {
	code: string;
	role: SessionRole;
	gun: GunChain | null;
	connected: boolean;
	calibration: CalibrationData | null;
	fineTune: FineTuneSettings | null;
	presence: Record<string, number>;
};

function createSessionState(): AppSession {
	return {
		code: '',
		role: 'projector',
		gun: null,
		connected: false,
		calibration: null,
		fineTune: null,
		presence: {}
	};
}

export const sessionState = $state<AppSession>(createSessionState());

let presenceInterval: ReturnType<typeof setInterval> | null = null;
let unsubCalibration: (() => void) | null = null;
let unsubFineTune: (() => void) | null = null;
let unsubPresence: (() => void) | null = null;

export async function joinSession(code: string, role: SessionRole): Promise<void> {
	if (!browser) return;
	await leaveSession();

	const gun = await initGun();
	sessionState.code = code.toUpperCase();
	sessionState.role = role;
	sessionState.gun = gun;
	sessionState.connected = true;
	storeSession(code, role);

	unsubCalibration = subscribeCalibration(gun, code, (data) => {
		sessionState.calibration = data;
	});

	unsubFineTune = subscribeFineTune(gun, code, (data) => {
		if (data) sessionState.fineTune = data;
	});

	unsubPresence = subscribePresence(gun, code, (roles) => {
		sessionState.presence = roles;
	});

	pingSession(gun, code, role);
	presenceInterval = setInterval(() => pingSession(gun, code, role), 5000);
}

export function createAndJoin(role: SessionRole = 'projector'): Promise<void> {
	const code = generateSessionCode();
	return joinSession(code, role);
}

export function leaveSession(): void {
	if (presenceInterval) clearInterval(presenceInterval);
	presenceInterval = null;
	unsubCalibration?.();
	unsubFineTune?.();
	unsubPresence?.();
	unsubCalibration = null;
	unsubFineTune = null;
	unsubPresence = null;
	Object.assign(sessionState, createSessionState());
}

export async function pushCalibration(data: CalibrationData): Promise<void> {
	if (!sessionState.gun || !sessionState.code) return;
	await publishCalibration(sessionState.gun, sessionState.code, data);
	sessionState.calibration = data;
}

export async function pushFineTune(settings: FineTuneSettings): Promise<void> {
	if (!sessionState.gun || !sessionState.code) return;
	await publishFineTune(sessionState.gun, sessionState.code, settings);
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
