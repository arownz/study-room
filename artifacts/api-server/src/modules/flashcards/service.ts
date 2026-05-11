import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import { z } from "zod";
import {
  createFlashcardBodySchema,
  listFlashcardsQuerySchema,
  updateFlashcardBodySchema,
} from "./contracts";
import { FlashcardsRepository } from "./repository";
import { FlashcardDecksRepository } from "../flashcard-decks/repository";

type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;
type CreateFlashcardBody = z.infer<typeof createFlashcardBodySchema>;
type UpdateFlashcardBody = z.infer<typeof updateFlashcardBodySchema>;

export class FlashcardsService {
  constructor(
    private readonly repository: FlashcardsRepository,
    private readonly decksRepository: FlashcardDecksRepository,
  ) {}

  private toDto(card: {
    id: string;
    deckId: string;
    question: string;
    answer: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: card.id,
      deckId: card.deckId,
      question: card.question,
      answer: card.answer,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  async listFlashcards(userId: string, query: ListFlashcardsQuery) {
    if (query.deckId) {
      const deck = await this.decksRepository.getDeckById(userId, query.deckId);
      if (!deck) {
        throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
      }
    }
    const items = await this.repository.listFlashcards(userId, query);
    return {
      items: items.map((item) => this.toDto(item)),
    };
  }

  async getFlashcardById(userId: string, flashcardId: string) {
    const card = await this.repository.getFlashcardById(userId, flashcardId);
    if (!card) {
      throw new AppError("Flashcard not found", 404, "FLASHCARD_NOT_FOUND");
    }
    return this.toDto(card);
  }

  async createFlashcard(userId: string, payload: CreateFlashcardBody) {
    const deck = await this.decksRepository.getDeckById(userId, payload.deckId);
    if (!deck) {
      throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
    }
    const card = await this.repository.createFlashcard(userId, randomUUID(), payload);
    if (!card) {
      throw new AppError("Failed to create flashcard", 500, "FLASHCARD_CREATE_FAILED");
    }
    return this.toDto(card);
  }

  async updateFlashcard(userId: string, flashcardId: string, payload: UpdateFlashcardBody) {
    if (payload.deckId) {
      const deck = await this.decksRepository.getDeckById(userId, payload.deckId);
      if (!deck) {
        throw new AppError("Deck not found", 404, "DECK_NOT_FOUND");
      }
    }
    const card = await this.repository.updateFlashcard(userId, flashcardId, payload);
    if (!card) {
      throw new AppError("Flashcard not found", 404, "FLASHCARD_NOT_FOUND");
    }
    return this.toDto(card);
  }

  async deleteFlashcard(userId: string, flashcardId: string) {
    const deleted = await this.repository.deleteFlashcard(userId, flashcardId);
    if (!deleted) {
      throw new AppError("Flashcard not found", 404, "FLASHCARD_NOT_FOUND");
    }
    return { id: deleted.id, deleted: true };
  }
}
