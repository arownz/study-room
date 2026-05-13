import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike } from "drizzle-orm";
import { whiteboards } from "@workspace/db/schema";
import { db } from "../../lib/database";
import type { CreateWhiteboardBody, ListWhiteboardsQuery, UpdateWhiteboardBody } from "./contracts";

export class WhiteboardRepository {
  async listByUserId(userId: string, query: ListWhiteboardsQuery) {
    return db
      .select()
      .from(whiteboards)
      .where(
        and(
          eq(whiteboards.userId, userId),
          query.q ? ilike(whiteboards.title, `%${query.q}%`) : undefined,
        ),
      )
      .orderBy(desc(whiteboards.updatedAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async getById(userId: string, whiteboardId: string) {
    const [row] = await db
      .select()
      .from(whiteboards)
      .where(and(eq(whiteboards.userId, userId), eq(whiteboards.id, whiteboardId)))
      .limit(1);
    return row ?? null;
  }

  async getMostRecentlyUpdated(userId: string) {
    const [row] = await db
      .select()
      .from(whiteboards)
      .where(eq(whiteboards.userId, userId))
      .orderBy(desc(whiteboards.updatedAt))
      .limit(1);
    return row ?? null;
  }

  async create(userId: string, payload: CreateWhiteboardBody & { snapshot: string; title: string }) {
    const now = new Date();
    const [row] = await db
      .insert(whiteboards)
      .values({
        id: randomUUID(),
        userId,
        title: payload.title,
        snapshot: payload.snapshot,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row ?? null;
  }

  async update(userId: string, whiteboardId: string, payload: UpdateWhiteboardBody) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.snapshot !== undefined) updates.snapshot = payload.snapshot;

    const [row] = await db
      .update(whiteboards)
      .set(updates)
      .where(and(eq(whiteboards.userId, userId), eq(whiteboards.id, whiteboardId)))
      .returning();
    return row ?? null;
  }

  async delete(userId: string, whiteboardId: string) {
    const [row] = await db
      .delete(whiteboards)
      .where(and(eq(whiteboards.userId, userId), eq(whiteboards.id, whiteboardId)))
      .returning({ id: whiteboards.id });
    return row ?? null;
  }
}
