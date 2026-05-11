import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "../../lib/app-error";
import { emitStudyRoomGoalsSync, emitStudyRoomTimer } from "../../realtime/study-room-emit";
import {
  createStudyRoomBodySchema,
  createStudyRoomGoalBodySchema,
  listStudyRoomGoalsResponseSchema,
  listStudyRoomsQuerySchema,
  patchStudyRoomTimerBodySchema,
  studyRoomGoalDtoSchema,
  studyRoomTimerDtoSchema,
  updateStudyRoomBodySchema,
  updateStudyRoomGoalBodySchema,
} from "./contracts";
import { StudyRoomsRepository } from "./repository";

type ListStudyRoomsQuery = z.infer<typeof listStudyRoomsQuerySchema>;
type CreateStudyRoomBody = z.infer<typeof createStudyRoomBodySchema>;
type UpdateStudyRoomBody = z.infer<typeof updateStudyRoomBodySchema>;
type CreateStudyRoomGoalBody = z.infer<typeof createStudyRoomGoalBodySchema>;
type UpdateStudyRoomGoalBody = z.infer<typeof updateStudyRoomGoalBodySchema>;
type PatchStudyRoomTimerBody = z.infer<typeof patchStudyRoomTimerBodySchema>;

type RoomRow = NonNullable<Awaited<ReturnType<StudyRoomsRepository["getStudyRoomById"]>>>;

function normalizePhase(value: string | null): "idle" | "focus" | "break" {
  if (value === "focus" || value === "break") return value;
  return "idle";
}

export class StudyRoomsService {
  constructor(private readonly repository: StudyRoomsRepository) {}

  private toDto(room: RoomRow) {
    return {
      id: room.id,
      name: room.name,
      description: room.description ?? null,
      isPublic: room.isPublic,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }

  timerDtoFromRow(room: RoomRow) {
    const phase = normalizePhase(room.timerPhase);
    const durationSec = room.timerDurationSec ?? null;
    let remainingSec = room.timerRemainingSec ?? durationSec ?? 0;
    let running = room.timerRunning;
    const anchor = room.timerAnchorEndsAt;

    if (running && anchor) {
      const sec = Math.ceil((anchor.getTime() - Date.now()) / 1000);
      remainingSec = Math.max(0, sec);
      if (remainingSec === 0) running = false;
    }

    return studyRoomTimerDtoSchema.parse({
      phase,
      durationSec,
      remainingSec,
      running,
      leaderUserId: room.timerLeaderUserId,
      anchorEndsAt: anchor ? anchor.toISOString() : null,
      updatedAt: room.updatedAt.toISOString(),
    });
  }

  async assertRoomAccess(userId: string, roomId: string) {
    const room = await this.repository.getStudyRoomById(userId, roomId);
    if (!room) {
      throw new AppError("Study room not found", 404, "STUDY_ROOM_NOT_FOUND");
    }
    return room;
  }

  async listStudyRooms(userId: string, query: ListStudyRoomsQuery) {
    const items = await this.repository.listStudyRooms(userId, query);
    return {
      items: items.map((room) => this.toDto(room)),
    };
  }

  async getStudyRoomById(userId: string, roomId: string) {
    const room = await this.repository.getStudyRoomById(userId, roomId);
    if (!room) {
      throw new AppError("Study room not found", 404, "STUDY_ROOM_NOT_FOUND");
    }
    return this.toDto(room);
  }

  async createStudyRoom(userId: string, payload: CreateStudyRoomBody) {
    const room = await this.repository.createStudyRoom(userId, randomUUID(), payload);
    if (!room) {
      throw new AppError("Failed to create study room", 500, "STUDY_ROOM_CREATE_FAILED");
    }
    return this.toDto(room);
  }

  async updateStudyRoom(userId: string, roomId: string, payload: UpdateStudyRoomBody) {
    const room = await this.repository.updateStudyRoom(userId, roomId, payload);
    if (!room) {
      throw new AppError("Study room not found", 404, "STUDY_ROOM_NOT_FOUND");
    }
    return this.toDto(room);
  }

  async deleteStudyRoom(userId: string, roomId: string) {
    const deleted = await this.repository.deleteStudyRoom(userId, roomId);
    if (!deleted) {
      throw new AppError("Study room not found", 404, "STUDY_ROOM_NOT_FOUND");
    }
    return { id: deleted.id, deleted: true };
  }

  async listStudyRoomGoals(userId: string, roomId: string) {
    await this.assertRoomAccess(userId, roomId);
    const rows = await this.repository.listGoals(roomId);
    return listStudyRoomGoalsResponseSchema.parse({
      items: rows.map((g) =>
        studyRoomGoalDtoSchema.parse({
          id: g.id,
          roomId: g.roomId,
          text: g.text,
          done: g.done,
          sortOrder: g.sortOrder,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
        }),
      ),
    });
  }

  async createStudyRoomGoal(userId: string, roomId: string, payload: CreateStudyRoomGoalBody) {
    await this.assertRoomAccess(userId, roomId);
    const row = await this.repository.createGoal(roomId, userId, randomUUID(), payload);
    if (!row) {
      throw new AppError("Failed to create goal", 500, "GOAL_CREATE_FAILED");
    }
    emitStudyRoomGoalsSync(roomId);
    return studyRoomGoalDtoSchema.parse({
      id: row.id,
      roomId: row.roomId,
      text: row.text,
      done: row.done,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  async updateStudyRoomGoal(userId: string, roomId: string, goalId: string, payload: UpdateStudyRoomGoalBody) {
    await this.assertRoomAccess(userId, roomId);
    const row = await this.repository.updateGoal(roomId, goalId, payload);
    if (!row) {
      throw new AppError("Goal not found", 404, "GOAL_NOT_FOUND");
    }
    emitStudyRoomGoalsSync(roomId);
    return studyRoomGoalDtoSchema.parse({
      id: row.id,
      roomId: row.roomId,
      text: row.text,
      done: row.done,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  async deleteStudyRoomGoal(userId: string, roomId: string, goalId: string) {
    await this.assertRoomAccess(userId, roomId);
    const deleted = await this.repository.deleteGoal(roomId, goalId);
    if (!deleted) {
      throw new AppError("Goal not found", 404, "GOAL_NOT_FOUND");
    }
    emitStudyRoomGoalsSync(roomId);
    return { id: deleted.id, deleted: true };
  }

  async getStudyRoomTimer(userId: string, roomId: string) {
    const room = await this.assertRoomAccess(userId, roomId);
    return this.timerDtoFromRow(room);
  }

  async patchStudyRoomTimer(userId: string, roomId: string, body: PatchStudyRoomTimerBody) {
    const room = await this.assertRoomAccess(userId, roomId);
    const curPhase = normalizePhase(room.timerPhase);

    let nextPhase = body.phase ?? curPhase;
    let durationSec = body.durationSec ?? room.timerDurationSec ?? null;
    let remainingSec =
      body.remainingSec ?? room.timerRemainingSec ?? durationSec ?? 25 * 60;
    let running = body.running ?? room.timerRunning;
    let anchorEndsAt: Date | null = room.timerAnchorEndsAt;
    let leaderUserId = room.timerLeaderUserId;

    if (body.running === true) {
      leaderUserId = userId;
      const rem =
        body.remainingSec ??
        room.timerRemainingSec ??
        durationSec ??
        25 * 60;
      remainingSec = rem;
      anchorEndsAt = new Date(Date.now() + rem * 1000);
      running = true;
    }

    if (body.running === false) {
      running = false;
      anchorEndsAt = null;
      if (body.remainingSec !== undefined) {
        remainingSec = body.remainingSec;
      }
    }

    if (body.phase === "idle") {
      nextPhase = "idle";
      running = false;
      anchorEndsAt = null;
    }

    const updated = await this.repository.updateTimerState(userId, roomId, {
      phase: nextPhase === "idle" ? null : nextPhase,
      durationSec,
      remainingSec,
      running,
      anchorEndsAt,
      leaderUserId,
    });
    if (!updated) {
      throw new AppError("Study room not found", 404, "STUDY_ROOM_NOT_FOUND");
    }
    const dto = this.timerDtoFromRow(updated);
    emitStudyRoomTimer(roomId, dto);
    return dto;
  }
}
