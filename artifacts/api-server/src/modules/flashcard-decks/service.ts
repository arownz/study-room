import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import { z } from "zod";
import {
  createFlashcardDeckBodySchema,
  listFlashcardDecksQuerySchema,
  updateFlashcardDeckBodySchema,
} from "./contracts";
import { FlashcardDecksRepository } from "./repository";

type ListQuery = z.infer<typeof listFlashcardDecksQuerySchema>;
type CreateBody = z.infer<typeof createFlashcardDeckBodySchema>;
type UpdateBody = z.infer<typeof updateFlashcardDeckBodySchema>;

export class FlashcardDecksService {
  constructor(private readonly repository: FlashcardDecksRepository) {}

  private toDto(deck: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    };
  }

  async listDecks(userId: string, query: ListQuery) {
    const items = await this.repository.listDecks(userId, query);
    return { items: items.map((d) => this.toDto(d)) };
  }

  async getDeckById(userId: string, deckId: string) {
    const deck = await this.repository.getDeckById(userId, deckId);
    if (!deck) {
      throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
    }
    return this.toDto(deck);
  }

  async createDeck(userId: string, payload: CreateBody) {
    const deck = await this.repository.createDeck(userId, randomUUID(), payload);
    if (!deck) {
      throw new AppError("Failed to create deck", 500, "DECK_CREATE_FAILED");
    }
    return this.toDto(deck);
  }

  async updateDeck(userId: string, deckId: string, payload: UpdateBody) {
    const deck = await this.repository.updateDeck(userId, deckId, payload);
    if (!deck) {
      throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
    }
    return this.toDto(deck);
  }

  async deleteDeck(userId: string, deckId: string) {
    const deleted = await this.repository.deleteDeck(userId, deckId);
    if (!deleted) {
      throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
    }
    return { id: deleted.id, deleted: true };
  }

  async deckStats(userId: string, deckId: string) {
    const stats = await this.repository.deckStats(userId, deckId);
    if (!stats) {
      throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
    }
    return stats;
  }
}
