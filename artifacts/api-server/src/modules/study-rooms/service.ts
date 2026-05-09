import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import { z } from "zod";
import {
  createStudyRoomBodySchema,
  listStudyRoomsQuerySchema,
  updateStudyRoomBodySchema,
} from "./contracts";
import { StudyRoomsRepository } from "./repository";

type ListStudyRoomsQuery = z.infer<typeof listStudyRoomsQuerySchema>;
type CreateStudyRoomBody = z.infer<typeof createStudyRoomBodySchema>;
type UpdateStudyRoomBody = z.infer<typeof updateStudyRoomBodySchema>;

export class StudyRoomsService {
  constructor(private readonly repository: StudyRoomsRepository) {}

  private toDto(room: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: room.id,
      name: room.name,
      description: room.description ?? null,
      isPublic: room.isPublic,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
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
}
