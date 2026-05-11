import { and, asc, desc, eq } from "drizzle-orm";
import { aiMessages, aiThreads } from "@workspace/db/schema";
import type { PaginationQuery } from "../../core/http/contracts";
import { db } from "../../lib/database";
import type { AppendAiMessageBody, CreateAiThreadBody } from "./types";

export class AiRepository {
  async listAiJobs(_query: PaginationQuery) {
    return [] as Array<{ id: string; type: string; status: string }>;
  }

  async createThread(userId: string, threadId: string, payload: CreateAiThreadBody) {
    const title = payload.title?.trim() || "New chat";
    await db.insert(aiThreads).values({
      id: threadId,
      userId,
      title,
    });
    const row = await this.getThread(userId, threadId);
    if (!row) throw new Error("ai thread insert failed");
    return row;
  }

  async listThreads(userId: string, query: PaginationQuery) {
    return db
      .select()
      .from(aiThreads)
      .where(eq(aiThreads.userId, userId))
      .orderBy(desc(aiThreads.updatedAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async getThread(userId: string, threadId: string) {
    const rows = await db
      .select()
      .from(aiThreads)
      .where(and(eq(aiThreads.userId, userId), eq(aiThreads.id, threadId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async touchThread(threadId: string) {
    await db
      .update(aiThreads)
      .set({ updatedAt: new Date() })
      .where(eq(aiThreads.id, threadId));
  }

  async maybeSetTitleFromFirstMessage(threadId: string, title: string) {
    const rows = await db.select().from(aiThreads).where(eq(aiThreads.id, threadId)).limit(1);
    const row = rows[0];
    if (!row || row.title !== "New chat") return;
    const trimmed = title.trim().slice(0, 80);
    if (!trimmed) return;
    await db.update(aiThreads).set({ title: trimmed, updatedAt: new Date() }).where(eq(aiThreads.id, threadId));
  }

  async listMessagesForThread(threadId: string) {
    return db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.threadId, threadId))
      .orderBy(asc(aiMessages.createdAt));
  }

  async insertMessage(
    threadId: string,
    messageId: string,
    role: "user" | "assistant",
    content: string,
    templateKey: string | null,
  ) {
    await db.insert(aiMessages).values({
      id: messageId,
      threadId,
      role,
      content,
      templateKey,
    });
    const rows = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.id, messageId))
      .limit(1);
    const row = rows[0];
    if (!row) throw new Error("ai message insert failed");
    return row;
  }
}
