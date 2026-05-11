import type { Server, Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import { auth } from "../modules/auth/auth";
import { patchStudyRoomTimerBodySchema } from "../modules/study-rooms/contracts";
import { StudyRoomsRepository } from "../modules/study-rooms/repository";
import { StudyRoomsService } from "../modules/study-rooms/service";
import { setSocketIo } from "./io";

const joinSchema = z.object({ roomId: z.string().min(1) });

const socketTimerPatchSchema = patchStudyRoomTimerBodySchema.and(
  z.object({ roomId: z.string().min(1) }),
);

type SocketData = {
  userId: string;
  userName: string;
  studyRooms: Set<string>;
};

function studyRoomsServiceFactory() {
  return new StudyRoomsService(new StudyRoomsRepository());
}

export function attachStudyRoomSocket(io: Server): void {
  setSocketIo(io);

  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(socket.handshake.headers),
      });
      if (!session?.user?.id) {
        next(new Error("Unauthorized"));
        return;
      }
      const s = socket as Socket & { data: SocketData };
      s.data.userId = session.user.id;
      s.data.userName = session.user.name ?? "Student";
      s.data.studyRooms = new Set();
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const s = socket as Socket & { data: SocketData };

    socket.on("studyRoom:join", async (raw: unknown) => {
      const parsed = joinSchema.safeParse(raw);
      if (!parsed.success) return;
      const { roomId } = parsed.data;
      const repo = new StudyRoomsRepository();
      const room = await repo.getStudyRoomById(s.data.userId, roomId);
      if (!room) {
        socket.emit("studyRoom:error", { code: "NOT_FOUND" });
        return;
      }
      await socket.join(`study-room:${roomId}`);
      s.data.studyRooms.add(roomId);
      const studyRoomsService = studyRoomsServiceFactory();
      const timer = await studyRoomsService.getStudyRoomTimer(s.data.userId, roomId);
      socket.emit("studyRoom:timer", timer);
      io.to(`study-room:${roomId}`).emit("studyRoom:presence", {
        roomId,
        userId: s.data.userId,
        name: s.data.userName,
        event: "join",
      });
    });

    socket.on("studyRoom:leave", async (raw: unknown) => {
      const parsed = joinSchema.safeParse(raw);
      if (!parsed.success) return;
      const { roomId } = parsed.data;
      await socket.leave(`study-room:${roomId}`);
      s.data.studyRooms.delete(roomId);
      io.to(`study-room:${roomId}`).emit("studyRoom:presence", {
        roomId,
        userId: s.data.userId,
        event: "leave",
      });
    });

    socket.on("studyRoom:timerPatch", async (raw: unknown) => {
      const parsed = socketTimerPatchSchema.safeParse(raw);
      if (!parsed.success) return;
      const { roomId, ...patch } = parsed.data;
      if (!s.data.studyRooms.has(roomId)) return;
      const studyRoomsService = studyRoomsServiceFactory();
      try {
        await studyRoomsService.patchStudyRoomTimer(s.data.userId, roomId, patch);
      } catch {
        socket.emit("studyRoom:error", { code: "TIMER_PATCH_FAILED" });
      }
    });

    socket.on("disconnecting", () => {
      for (const roomId of s.data.studyRooms) {
        io.to(`study-room:${roomId}`).emit("studyRoom:presence", {
          roomId,
          userId: s.data.userId,
          event: "leave",
        });
      }
    });
  });
}
