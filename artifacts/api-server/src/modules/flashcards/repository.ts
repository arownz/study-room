import { and, desc, eq } from "drizzle-orm";
import { flashcards } from "@workspace/db/schema";
import type { SQL } from "drizzle-orm";
import { db } from "../../lib/database";
import { z } from "zod";
import {
  createFlashcardBodySchema,
  listFlashcardsQuerySchema,
  updateFlashcardBodySchema,
} from "./contracts";

type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;
type CreateFlashcardBody = z.infer<typeof createFlashcardBodySchema>;
type UpdateFlashcardBody = z.infer<typeof updateFlashcardBodySchema>;

export class FlashcardsRepository {
  async listFlashcards(userId: string, query: ListFlashcardsQuery) {
    const conditions: SQL[] = [eq(flashcards.userId, userId)];
    if (query.deckId) {
      conditions.push(eq(flashcards.deckId, query.deckId));
    }
    return db
      .select()
      .from(flashcards)
      .where(and(...conditions))
      .orderBy(desc(flashcards.updatedAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async getFlashcardById(userId: string, flashcardId: string) {
    const rows = await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.userId, userId), eq(flashcards.id, flashcardId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async createFlashcard(userId: string, flashcardId: string, payload: CreateFlashcardBody) {
    await db.insert(flashcards).values({
      id: flashcardId,
      userId,
      deckId: payload.deckId,
      question: payload.question,
      answer: payload.answer,
    });
    return this.getFlashcardById(userId, flashcardId);
  }

  async updateFlashcard(userId: string, flashcardId: string, payload: UpdateFlashcardBody) {
    const { deckId, question, answer } = payload;
    await db
      .update(flashcards)
      .set({
        ...(deckId !== undefined ? { deckId } : {}),
        ...(question !== undefined ? { question } : {}),
        ...(answer !== undefined ? { answer } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(flashcards.userId, userId), eq(flashcards.id, flashcardId)));
    return this.getFlashcardById(userId, flashcardId);
  }

  async deleteFlashcard(userId: string, flashcardId: string) {
    const deleted = await db
      .delete(flashcards)
      .where(and(eq(flashcards.userId, userId), eq(flashcards.id, flashcardId)))
      .returning({ id: flashcards.id });
    return deleted[0] ?? null;
  }
}
