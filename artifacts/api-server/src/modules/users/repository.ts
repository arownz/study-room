import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  accounts,
  flashcardDecks,
  flashcards,
  noteImageAssets,
  notes,
  pomodoroSessions,
  studyRooms,
  users,
} from "@workspace/db/schema";
import { db } from "../../lib/database";
import type { ListUsersQuery, UpdateMeRequest } from "./contracts";

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  avatar: users.avatar,
  role: users.role,
  roleSelected: users.roleSelected,
  emailVerified: users.emailVerified,
  notificationPreferences: users.notificationPreferences,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

export class UsersRepository {
  async listUsers(query: ListUsersQuery) {
    const rows = await db
      .select(userColumns)
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return rows;
  }

  async getUserById(id: string) {
    const [row] = await db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ?? null;
  }

  async listAccountsForUser(userId: string) {
    const rows = await db
      .select({
        providerId: accounts.providerId,
        accountId: accounts.accountId,
        scope: accounts.scope,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));
    return rows;
  }

  async updateUser(id: string, patch: UpdateMeRequest) {
    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.avatar !== undefined) updates.avatar = patch.avatar;
    if (patch.role !== undefined) updates.role = patch.role;
    if (patch.roleSelected !== undefined) updates.roleSelected = patch.roleSelected;
    if (patch.notificationPreferences !== undefined) {
      updates.notificationPreferences = JSON.stringify(patch.notificationPreferences);
    }

    if (Object.keys(updates).length === 0) {
      return this.getUserById(id);
    }

    updates.updatedAt = new Date();

    const [row] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning(userColumns);
    return row ?? null;
  }

  async setAvatar(id: string, avatar: string | null) {
    const [row] = await db
      .update(users)
      .set({ avatar, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(userColumns);
    return row ?? null;
  }

  async unlinkAccount(userId: string, providerId: string) {
    await db
      .delete(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, providerId)),
      );
  }

  async getDashboardSummary(userId: string) {
    const [
      notesCountRow,
      flashcardsCountRow,
      decksCountRow,
      roomsCountRow,
      pomodoroCountRow,
      recentNoteRows,
    ] = await Promise.all([
      db
        .select({ c: count() })
        .from(notes)
        .where(and(eq(notes.userId, userId), isNull(notes.deletedAt))),
      db
        .select({ c: count() })
        .from(flashcards)
        .where(eq(flashcards.userId, userId)),
      db
        .select({ c: count() })
        .from(flashcardDecks)
        .where(eq(flashcardDecks.userId, userId)),
      db
        .select({ c: count() })
        .from(studyRooms)
        .where(eq(studyRooms.ownerId, userId)),
      db
        .select({ c: count() })
        .from(pomodoroSessions)
        .where(eq(pomodoroSessions.userId, userId)),
      db
        .select({
          id: notes.id,
          title: notes.title,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
        .orderBy(desc(notes.updatedAt))
        .limit(5),
    ]);

    return {
      notesCount: Number(notesCountRow[0]?.c ?? 0),
      flashcardsCount: Number(flashcardsCountRow[0]?.c ?? 0),
      flashcardDecksCount: Number(decksCountRow[0]?.c ?? 0),
      studyRoomsCount: Number(roomsCountRow[0]?.c ?? 0),
      pomodoroSessionsCompletedTotal: Number(pomodoroCountRow[0]?.c ?? 0),
      recentNotes: recentNoteRows.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async insertNoteImageAsset(input: {
    id: string;
    userId: string;
    mimeType: string;
    data: Buffer;
  }): Promise<void> {
    await db.insert(noteImageAssets).values({
      id: input.id,
      userId: input.userId,
      mimeType: input.mimeType,
      data: input.data,
      createdAt: new Date(),
    });
  }

  async getNoteImageAssetOwned(assetId: string, userId: string) {
    const [row] = await db
      .select({
        mimeType: noteImageAssets.mimeType,
        data: noteImageAssets.data,
      })
      .from(noteImageAssets)
      .where(and(eq(noteImageAssets.id, assetId), eq(noteImageAssets.userId, userId)))
      .limit(1);
    return row ?? null;
  }
}
