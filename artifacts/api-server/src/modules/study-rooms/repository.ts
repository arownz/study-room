import { and, asc, desc, eq, max } from "drizzle-orm";
import { studyRoomGoals, studyRooms } from "@workspace/db/schema";
import { db } from "../../lib/database";
import {
  createStudyRoomBodySchema,
  createStudyRoomGoalBodySchema,
  listStudyRoomsQuerySchema,
  updateStudyRoomBodySchema,
  updateStudyRoomGoalBodySchema,
} from "./contracts";
import { z } from "zod";

type ListStudyRoomsQuery = z.infer<typeof listStudyRoomsQuerySchema>;
type CreateStudyRoomBody = z.infer<typeof createStudyRoomBodySchema>;
type UpdateStudyRoomBody = z.infer<typeof updateStudyRoomBodySchema>;
type CreateStudyRoomGoalBody = z.infer<typeof createStudyRoomGoalBodySchema>;
type UpdateStudyRoomGoalBody = z.infer<typeof updateStudyRoomGoalBodySchema>;
export class StudyRoomsRepository {
  async listStudyRooms(userId: string, query: ListStudyRoomsQuery) {
    return db
      .select()
      .from(studyRooms)
      .where(eq(studyRooms.ownerId, userId))
      .orderBy(desc(studyRooms.updatedAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async getStudyRoomById(userId: string, roomId: string) {
    const rows = await db
      .select()
      .from(studyRooms)
      .where(and(eq(studyRooms.ownerId, userId), eq(studyRooms.id, roomId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async createStudyRoom(userId: string, roomId: string, payload: CreateStudyRoomBody) {
    await db.insert(studyRooms).values({
      id: roomId,
      ownerId: userId,
      name: payload.name,
      description: payload.description ?? null,
      isPublic: payload.isPublic ?? false,
    });
    return this.getStudyRoomById(userId, roomId);
  }

  async updateStudyRoom(userId: string, roomId: string, payload: UpdateStudyRoomBody) {
    await db
      .update(studyRooms)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(and(eq(studyRooms.ownerId, userId), eq(studyRooms.id, roomId)));

    return this.getStudyRoomById(userId, roomId);
  }

  async deleteStudyRoom(userId: string, roomId: string) {
    const deleted = await db
      .delete(studyRooms)
      .where(and(eq(studyRooms.ownerId, userId), eq(studyRooms.id, roomId)))
      .returning({ id: studyRooms.id });
    return deleted[0] ?? null;
  }

  async listGoals(roomId: string) {
    return db
      .select()
      .from(studyRoomGoals)
      .where(eq(studyRoomGoals.roomId, roomId))
      .orderBy(asc(studyRoomGoals.sortOrder), desc(studyRoomGoals.createdAt));
  }

  async nextGoalSortOrder(roomId: string) {
    const rows = await db
      .select({ m: max(studyRoomGoals.sortOrder) })
      .from(studyRoomGoals)
      .where(eq(studyRoomGoals.roomId, roomId));
    return (rows[0]?.m ?? -1) + 1;
  }

  async createGoal(roomId: string, userId: string, goalId: string, payload: CreateStudyRoomGoalBody) {
    const sortOrder = await this.nextGoalSortOrder(roomId);
    await db.insert(studyRoomGoals).values({
      id: goalId,
      roomId,
      userId,
      text: payload.text,
      sortOrder,
    });
    const rows = await db
      .select()
      .from(studyRoomGoals)
      .where(eq(studyRoomGoals.id, goalId))
      .limit(1);
    return rows[0] ?? null;
  }

  async getGoal(roomId: string, goalId: string) {
    const rows = await db
      .select()
      .from(studyRoomGoals)
      .where(and(eq(studyRoomGoals.roomId, roomId), eq(studyRoomGoals.id, goalId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateGoal(roomId: string, goalId: string, payload: UpdateStudyRoomGoalBody) {
    await db
      .update(studyRoomGoals)
      .set({
        ...(payload.text !== undefined ? { text: payload.text } : {}),
        ...(payload.done !== undefined ? { done: payload.done } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(studyRoomGoals.roomId, roomId), eq(studyRoomGoals.id, goalId)));
    return this.getGoal(roomId, goalId);
  }

  async deleteGoal(roomId: string, goalId: string) {
    const deleted = await db
      .delete(studyRoomGoals)
      .where(and(eq(studyRoomGoals.roomId, roomId), eq(studyRoomGoals.id, goalId)))
      .returning({ id: studyRoomGoals.id });
    return deleted[0] ?? null;
  }

  async updateTimerState(
    userId: string,
    roomId: string,
    state: {
      phase: string | null;
      durationSec: number | null;
      remainingSec: number | null;
      running: boolean;
      anchorEndsAt: Date | null;
      leaderUserId: string | null;
    },
  ) {
    await db
      .update(studyRooms)
      .set({
        timerPhase: state.phase,
        timerDurationSec: state.durationSec,
        timerRemainingSec: state.remainingSec,
        timerRunning: state.running,
        timerAnchorEndsAt: state.anchorEndsAt,
        timerLeaderUserId: state.leaderUserId,
        updatedAt: new Date(),
      })
      .where(and(eq(studyRooms.ownerId, userId), eq(studyRooms.id, roomId)));
    return this.getStudyRoomById(userId, roomId);
  }
}
