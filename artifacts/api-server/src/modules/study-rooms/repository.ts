import { and, desc, eq } from "drizzle-orm";
import { studyRooms } from "@workspace/db/schema";
import { db } from "../../lib/database";
import {
  createStudyRoomBodySchema,
  listStudyRoomsQuerySchema,
  updateStudyRoomBodySchema,
} from "./contracts";
import { z } from "zod";

type ListStudyRoomsQuery = z.infer<typeof listStudyRoomsQuerySchema>;
type CreateStudyRoomBody = z.infer<typeof createStudyRoomBodySchema>;
type UpdateStudyRoomBody = z.infer<typeof updateStudyRoomBodySchema>;

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
}
