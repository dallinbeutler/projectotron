import { joinRoom, type MessageAction, type Room } from 'trystero';
import type { CalibrationData, FineTuneSettings, SessionRole } from '$lib/types';

const APP_ID = 'projectotron-v1';

export type SyncRoom = {
	room: Room;
	calibrationAction: MessageAction<CalibrationData>;
	fineTuneAction: MessageAction<FineTuneSettings>;
	leave: () => void;
};

let activeRoom: SyncRoom | null = null;

export function getActiveSyncRoom(): SyncRoom | null {
	return activeRoom;
}

export function joinSyncRoom(
	code: string,
	handlers: {
		onCalibration?: (data: CalibrationData) => void;
		onFineTune?: (data: FineTuneSettings) => void;
		onPeerJoin?: (peerId: string) => void;
		onPeerLeave?: (peerId: string) => void;
	}
): SyncRoom {
	leaveSyncRoom();

	const room = joinRoom({ appId: APP_ID }, code.toUpperCase());
	const calibrationAction = room.makeAction<CalibrationData>('calibration');
	const fineTuneAction = room.makeAction<FineTuneSettings>('fineTune');

	calibrationAction.onMessage = (data) => {
		if (data?.homography && data?.projector) handlers.onCalibration?.(data);
	};

	fineTuneAction.onMessage = (data) => {
		if (data?.rect) handlers.onFineTune?.(data);
	};

	room.onPeerJoin = (peerId) => handlers.onPeerJoin?.(peerId);
	room.onPeerLeave = (peerId) => handlers.onPeerLeave?.(peerId);

	const syncRoom: SyncRoom = {
		room,
		calibrationAction,
		fineTuneAction,
		leave: leaveSyncRoom
	};

	activeRoom = syncRoom;
	return syncRoom;
}

export function leaveSyncRoom(): void {
	if (activeRoom) {
		void activeRoom.room.leave();
		activeRoom = null;
	}
}

export function publishCalibrationSync(data: CalibrationData): void {
	void activeRoom?.calibrationAction.send(data);
}

export function publishFineTuneSync(settings: FineTuneSettings): void {
	void activeRoom?.fineTuneAction.send(settings);
}

export function peerCount(room: Room | null): number {
	if (!room) return 0;
	return Object.keys(room.getPeers()).length;
}

export type { SessionRole };
