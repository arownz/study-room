import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import type {
  AutosaveNoteBody,
  CreateNoteBody,
  CreateNoteFolderBody,
  ListNotesQuery,
  NoteCollaboratorBody,
  UpdateNoteBody,
  UpdateNoteFolderBody,
} from "./contracts";
import { NotesRepository } from "./repository";

export class NotesService {
  constructor(private readonly repository: NotesRepository) {}

  private toDto(note: {
    id: string;
    userId: string;
    folderId: string | null;
    title: string;
    content: string;
    collaboratorPermission: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: note.id,
      ownerId: note.userId,
      folderId: note.folderId ?? null,
      title: note.title,
      content: note.content,
      access:
        note.collaboratorPermission === "editor" || note.collaboratorPermission === "viewer"
          ? note.collaboratorPermission
          : "owner",
      deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  async listNotes(userId: string, query: ListNotesQuery) {
    const rows = await this.repository.listNotes(userId, query);
    return {
      items: rows.map((row) => this.toDto(row)),
      page: {
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

  async getNoteById(userId: string, noteId: string) {
    const note = await this.repository.getNoteById(userId, noteId);
    if (!note) {
      throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    }
    return this.toDto(note);
  }

  async createNote(userId: string, payload: CreateNoteBody) {
    if (payload.folderId) {
      const folder = await this.repository.getFolderById(userId, payload.folderId);
      if (!folder) {
        throw new AppError("Folder not found", 404, "NOTE_FOLDER_NOT_FOUND");
      }
    }

    const noteId = randomUUID();
    const note = await this.repository.createNote(userId, noteId, payload);
    if (!note) {
      throw new AppError("Failed to create note", 500, "NOTE_CREATE_FAILED");
    }
    return this.toDto(note);
  }

  async updateNote(userId: string, noteId: string, payload: UpdateNoteBody) {
    if (payload.folderId !== undefined && payload.folderId !== null) {
      const folder = await this.repository.getFolderById(userId, payload.folderId);
      if (!folder) {
        throw new AppError("Folder not found", 404, "NOTE_FOLDER_NOT_FOUND");
      }
    }

    const note = await this.repository.updateNote(userId, noteId, payload);
    if (!note) {
      throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    }
    return this.toDto(note);
  }

  async deleteNote(userId: string, noteId: string) {
    const deleted = await this.repository.softDeleteNote(userId, noteId);
    if (!deleted) {
      throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    }
    return { id: deleted.id, deleted: true };
  }

  async autosaveNote(userId: string, noteId: string, payload: AutosaveNoteBody) {
    const note = await this.repository.autosaveNote(userId, noteId, payload.content);
    if (!note) {
      throw new AppError("Note not found or no edit permission", 404, "NOTE_NOT_FOUND");
    }
    return this.toDto(note);
  }

  async listFolders(userId: string) {
    const rows = await this.repository.listFolders(userId);
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async createFolder(userId: string, payload: CreateNoteFolderBody) {
    const folder = await this.repository.createFolder(userId, randomUUID(), payload);
    if (!folder) {
      throw new AppError("Failed to create folder", 500, "NOTE_FOLDER_CREATE_FAILED");
    }
    return {
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  async updateFolder(userId: string, folderId: string, payload: UpdateNoteFolderBody) {
    const folder = await this.repository.updateFolder(userId, folderId, payload);
    if (!folder) {
      throw new AppError("Folder not found", 404, "NOTE_FOLDER_NOT_FOUND");
    }
    return {
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await this.repository.getFolderById(userId, folderId);
    if (!folder) {
      throw new AppError("Folder not found", 404, "NOTE_FOLDER_NOT_FOUND");
    }
    await this.repository.softDeleteFolder(userId, folderId);
    return { id: folderId, deleted: true };
  }

  async listCollaborators(userId: string, noteId: string) {
    const note = await this.repository.getNoteById(userId, noteId);
    if (!note) {
      throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    }
    const rows = await this.repository.listCollaborators(noteId);
    return {
      items: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        email: row.email,
        name: row.name,
        permission: row.permission,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async upsertCollaborator(userId: string, noteId: string, payload: NoteCollaboratorBody) {
    const note = await this.repository.getNoteById(userId, noteId);
    if (!note || note.userId !== userId) {
      throw new AppError("Only note owner can manage collaborators", 403, "NOTE_FORBIDDEN");
    }
    const collaborator = await this.repository.findUserByEmail(payload.email);
    if (!collaborator) {
      throw new AppError("Collaborator user not found", 404, "COLLABORATOR_NOT_FOUND");
    }
    if (collaborator.id === userId) {
      throw new AppError("Cannot add owner as collaborator", 400, "COLLABORATOR_INVALID");
    }
    await this.repository.upsertCollaborator(noteId, collaborator.id, payload.permission);
    return this.listCollaborators(userId, noteId);
  }

  async removeCollaborator(userId: string, noteId: string, collaboratorUserId: string) {
    const note = await this.repository.getNoteById(userId, noteId);
    if (!note || note.userId !== userId) {
      throw new AppError("Only note owner can manage collaborators", 403, "NOTE_FORBIDDEN");
    }
    const removed = await this.repository.removeCollaborator(noteId, collaboratorUserId);
    if (!removed) {
      throw new AppError("Collaborator not found", 404, "COLLABORATOR_NOT_FOUND");
    }
    return { id: removed.id, deleted: true };
  }
}
