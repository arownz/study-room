import { and, count, desc, eq, max } from "drizzle-orm";
import { flashcardDecks, flashcards } from "@workspace/db/schema";
import { db } from "../../lib/database";
import { z } from "zod";
import {
  createFlashcardDeckBodySchema,
  listFlashcardDecksQuerySchema,
  updateFlashcardDeckBodySchema,
} from "./contracts";

type ListQuery = z.infer<typeof listFlashcardDecksQuerySchema>;
type CreateBody = z.infer<typeof createFlashcardDeckBodySchema>;
type UpdateBody = z.infer<typeof updateFlashcardDeckBodySchema>;

export class FlashcardDecksRepository {
  async listDecks(userId: string, query: ListQuery) {
    return db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.userId, userId))
      .orderBy(desc(flashcardDecks.updatedAt))
      .limit(query.limit)
      .offset(query.offset);
  }

  async getDeckById(userId: string, deckId: string) {
    const rows = await db
      .select()
      .from(flashcardDecks)
      .where(and(eq(flashcardDecks.userId, userId), eq(flashcardDecks.id, deckId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async createDeck(userId: string, deckId: string, payload: CreateBody) {
    await db.insert(flashcardDecks).values({
      id: deckId,
      userId,
      title: payload.title,
      description: payload.description ?? null,
    });
    return this.getDeckById(userId, deckId);
  }

  async updateDeck(userId: string, deckId: string, payload: UpdateBody) {
    await db
      .update(flashcardDecks)
      .set({
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(flashcardDecks.userId, userId), eq(flashcardDecks.id, deckId)));
    return this.getDeckById(userId, deckId);
  }

  async deleteDeck(userId: string, deckId: string) {
    const deleted = await db
      .delete(flashcardDecks)
      .where(and(eq(flashcardDecks.userId, userId), eq(flashcardDecks.id, deckId)))
      .returning({ id: flashcardDecks.id });
    return deleted[0] ?? null;
  }

  async deckStats(userId: string, deckId: string) {
    const deck = await this.getDeckById(userId, deckId);
    if (!deck) return null;
    const row = await db
      .select({
        cardCount: count(),
        lastUpdated: max(flashcards.updatedAt),
      })
      .from(flashcards)
      .where(and(eq(flashcards.userId, userId), eq(flashcards.deckId, deckId)));
    const agg = row[0];
    const n = Number(agg?.cardCount ?? 0);
    const last = agg?.lastUpdated;
    return {
      cardCount: Number.isFinite(n) ? n : 0,
      lastCardUpdatedAt: last instanceof Date ? last.toISOString() : null,
    };
  }
}
