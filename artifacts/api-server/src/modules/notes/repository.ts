import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { noteCollaborators, noteFolders, notes, users } from "@workspace/db/schema";
import { db } from "../../lib/database";
import type {
  CreateNoteBody,
  CreateNoteFolderBody,
  ListNotesQuery,
  NotePermission,
  UpdateNoteBody,
  UpdateNoteFolderBody,
} from "./contracts";

export type NoteAccess = "owner" | NotePermission;

export class NotesRepository {
  private noteReadScope(userId: string) {
    return or(
      eq(notes.userId, userId),
      eq(noteCollaborators.userId, userId),
    )!;
  }

  async listFolders(userId: string) {
    return db
      .select()
      .from(noteFolders)
      .where(and(eq(noteFolders.userId, userId), isNull(noteFolders.deletedAt)))
      .orderBy(desc(noteFolders.updatedAt));
  }

  async createFolder(userId: string, folderId: string, payload: CreateNoteFolderBody) {
    await db.insert(noteFolders).values({
      id: folderId,
      userId,
      name: payload.name,
    });
    return this.getFolderById(userId, folderId);
  }

  async getFolderById(userId: string, folderId: string) {
    const rows = await db
      .select()
      .from(noteFolders)
      .where(
        and(
          eq(noteFolders.userId, userId),
          eq(noteFolders.id, folderId),
          isNull(noteFolders.deletedAt),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async updateFolder(userId: string, folderId: string, payload: UpdateNoteFolderBody) {
    await db
      .update(noteFolders)
      .set({
        name: payload.name,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(noteFolders.userId, userId),
          eq(noteFolders.id, folderId),
          isNull(noteFolders.deletedAt),
        ),
      );
    return this.getFolderById(userId, folderId);
  }

  async softDeleteFolder(userId: string, folderId: string) {
    await db
      .update(noteFolders)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(noteFolders.userId, userId),
          eq(noteFolders.id, folderId),
          isNull(noteFolders.deletedAt),
        ),
      );
  }

  async listNotes(userId: string, query: ListNotesQuery) {
    let whereClause = this.noteReadScope(userId);
    if (!query.includeDeleted) {
      whereClause = and(whereClause, isNull(notes.deletedAt))!;
    }
    if (query.folderId) {
      whereClause = and(whereClause, eq(notes.folderId, query.folderId))!;
    }
    if (query.q) {
      whereClause = and(
        whereClause,
        or(ilike(notes.title, `%${query.q}%`), ilike(notes.content, `%${query.q}%`))!,
      )!;
    }

    return db
      .select({
        id: notes.id,
        userId: notes.userId,
        folderId: notes.folderId,
        title: notes.title,
        content: notes.content,
        deletedAt: notes.deletedAt,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        collaboratorPermission: noteCollaborators.permission,
      })
      .from(notes)
      .leftJoin(
        noteCollaborators,
        and(eq(noteCollaborators.noteId, notes.id), eq(noteCollaborators.userId, userId)),
      )
      .where(whereClause)
      .groupBy(
        notes.id,
        notes.userId,
        notes.folderId,
        notes.title,
        notes.content,
        notes.deletedAt,
        notes.createdAt,
        notes.updatedAt,
        noteCollaborators.permission,
      )
      .orderBy(desc(notes.updatedAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async getNoteById(userId: string, noteId: string) {
    const rows = await db
      .select({
        id: notes.id,
        userId: notes.userId,
        folderId: notes.folderId,
        title: notes.title,
        content: notes.content,
        deletedAt: notes.deletedAt,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        collaboratorPermission: noteCollaborators.permission,
      })
      .from(notes)
      .leftJoin(
        noteCollaborators,
        and(eq(noteCollaborators.noteId, notes.id), eq(noteCollaborators.userId, userId)),
      )
      .where(and(this.noteReadScope(userId), eq(notes.id, noteId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async createNote(userId: string, noteId: string, payload: CreateNoteBody) {
    await db.insert(notes).values({
      id: noteId,
      userId,
      title: payload.title,
      content: payload.content,
      folderId: payload.folderId,
    });
    return this.getNoteById(userId, noteId);
  }

  async assertNoteWriteAccess(userId: string, noteId: string) {
    const note = await this.getNoteById(userId, noteId);
    if (!note) return null;
    if (note.userId === userId) return { ...note, access: "owner" as NoteAccess };
    if (note.collaboratorPermission === "editor") {
      return { ...note, access: "editor" as NoteAccess };
    }
    return null;
  }

  async updateNote(userId: string, noteId: string, payload: UpdateNoteBody) {
    const writable = await this.assertNoteWriteAccess(userId, noteId);
    if (!writable) return null;

    await db
      .update(notes)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    return this.getNoteById(userId, noteId);
  }

  async autosaveNote(userId: string, noteId: string, content: string) {
    return this.updateNote(userId, noteId, { content });
  }

  async softDeleteNote(userId: string, noteId: string) {
    const writable = await this.assertNoteWriteAccess(userId, noteId);
    if (!writable) return null;

    const deleted = await db
      .update(notes)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId))
      .returning({ id: notes.id });
    return deleted[0] ?? null;
  }

  async listCollaborators(noteId: string) {
    return db
      .select({
        id: noteCollaborators.id,
        userId: noteCollaborators.userId,
        permission: noteCollaborators.permission,
        createdAt: noteCollaborators.createdAt,
        updatedAt: noteCollaborators.updatedAt,
        email: users.email,
        name: users.name,
      })
      .from(noteCollaborators)
      .innerJoin(users, eq(users.id, noteCollaborators.userId))
      .where(eq(noteCollaborators.noteId, noteId))
      .orderBy(desc(noteCollaborators.createdAt));
  }

  async findUserByEmail(email: string) {
    const rows = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertCollaborator(noteId: string, userId: string, permission: NotePermission) {
    const existing = await db
      .select({ id: noteCollaborators.id })
      .from(noteCollaborators)
      .where(and(eq(noteCollaborators.noteId, noteId), eq(noteCollaborators.userId, userId)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(noteCollaborators)
        .set({ permission, updatedAt: new Date() })
        .where(eq(noteCollaborators.id, existing[0].id));
      return existing[0].id;
    }

    const row = await db
      .insert(noteCollaborators)
      .values({
        id: randomUUID(),
        noteId,
        userId,
        permission,
      })
      .returning({ id: noteCollaborators.id });
    return row[0]?.id ?? null;
  }

  async removeCollaborator(noteId: string, collaboratorUserId: string) {
    const rows = await db
      .delete(noteCollaborators)
      .where(
        and(
          eq(noteCollaborators.noteId, noteId),
          eq(noteCollaborators.userId, collaboratorUserId),
        ),
      )
      .returning({ id: noteCollaborators.id });
    return rows[0] ?? null;
  }
}
