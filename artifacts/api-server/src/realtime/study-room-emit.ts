import { getSocketIo } from "./io";

export function studyRoomChannel(roomId: string): string {
  return `study-room:${roomId}`;
}

export function emitStudyRoomTimer(roomId: string, payload: unknown): void {
  const io = getSocketIo();
  if (!io) return;
  io.to(studyRoomChannel(roomId)).emit("studyRoom:timer", payload);
}

export function emitStudyRoomGoalsSync(roomId: string): void {
  const io = getSocketIo();
  if (!io) return;
  io.to(studyRoomChannel(roomId)).emit("studyRoom:goalsSync", { roomId, at: Date.now() });
}
