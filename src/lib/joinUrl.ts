import { base } from '$app/paths';

/** Full URL for a phone to open camera mode and join a session (for QR codes). */
export function cameraJoinUrl(sessionCode: string): string {
	const code = encodeURIComponent(sessionCode.toUpperCase());
	if (typeof window !== 'undefined') {
		return `${window.location.origin}${base}/camera/?session=${code}`;
	}
	return `${base}/camera/?session=${code}`;
}

export function sessionFromSearchParams(params: URLSearchParams): string | null {
	const session = params.get('session')?.trim().toUpperCase();
	if (session && /^[A-Z0-9]{6}$/.test(session)) return session;
	return null;
}
