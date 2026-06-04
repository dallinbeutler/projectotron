import type { CalibrationData, FineTuneSettings, SessionRole } from '$lib/types';

export const GUN_PEERS = [
	'https://gun-manhattan.herokuapp.com/gun',
	'https://gun-us.herokuapp.com/gun'
];

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

export type GunAck = { err?: string; ok?: number };

export type GunChain = {
	get: (key: string) => GunChain;
	put: (data: unknown, cb?: (ack: GunAck) => void) => GunChain;
	on: (cb: (data: unknown, key: string) => void) => GunChain;
	map: () => GunChain;
};

type GunConstructor = new (opts?: { peers?: string[]; localStorage?: boolean }) => GunChain;

let gunInstance: GunChain | null = null;

export async function initGun(): Promise<GunChain> {
	if (gunInstance) return gunInstance;
	const mod = await import('gun/gun.js');
	const Gun = ((mod as { default?: GunConstructor }).default ??
		mod) as unknown as GunConstructor;
	gunInstance = new Gun({ peers: GUN_PEERS, localStorage: false }) as GunChain;
	return gunInstance;
}

function sessionNode(gun: GunChain, code: string) {
	return gun.get('projectotron').get('sessions').get(code);
}

export function publishCalibration(
	gun: GunChain,
	code: string,
	data: CalibrationData
): Promise<void> {
	return new Promise((resolve, reject) => {
		sessionNode(gun, code)
			.get('calibration')
			.put(data, (ack) => {
				if (ack.err) reject(new Error(ack.err));
				else resolve();
			});
	});
}

export function subscribeCalibration(
	gun: GunChain,
	code: string,
	onData: (data: CalibrationData | null) => void
): () => void {
	const node = sessionNode(gun, code).get('calibration');
	const handler = (data: unknown) => {
		if (!data || typeof data !== 'object') return;
		const cal = data as CalibrationData;
		if (cal.homography && cal.projector) {
			onData(cal);
		}
	};
	node.on(handler);
	return () => {};
}

export function publishFineTune(
	gun: GunChain,
	code: string,
	settings: FineTuneSettings
): Promise<void> {
	return new Promise((resolve, reject) => {
		sessionNode(gun, code)
			.get('fineTune')
			.put(settings, (ack) => {
				if (ack.err) reject(new Error(ack.err));
				else resolve();
			});
	});
}

export function subscribeFineTune(
	gun: GunChain,
	code: string,
	onData: (data: FineTuneSettings | null) => void
): () => void {
	const node = sessionNode(gun, code).get('fineTune');
	const handler = (data: unknown) => {
		if (!data || typeof data !== 'object') return;
		onData(data as FineTuneSettings);
	};
	node.on(handler);
	return () => {};
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

export function pingSession(gun: GunChain, code: string, role: SessionRole): void {
	sessionNode(gun, code).get('presence').get(role).put({ at: Date.now() });
}

export function subscribePresence(
	gun: GunChain,
	code: string,
	onPresence: (roles: Record<string, number>) => void
): () => void {
	const roles: Record<string, number> = {};
	const node = sessionNode(gun, code).get('presence');
	node.map().on((data: unknown, key: string) => {
		if (data && typeof data === 'object' && 'at' in data) {
			roles[key] = (data as { at: number }).at;
			onPresence({ ...roles });
		}
	});
	return () => {};
}
