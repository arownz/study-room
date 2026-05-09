import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import { z } from "zod";
import {
  createFlashcardBodySchema,
  listFlashcardsQuerySchema,
  updateFlashcardBodySchema,
} from "./contracts";
import { FlashcardsRepository } from "./repository";

type ListFlashcardsQuery = z.infer<typeof listFlashcardsQuerySchema>;
type CreateFlashcardBody = z.infer<typeof createFlashcardBodySchema>;
type UpdateFlashcardBody = z.infer<typeof updateFlashcardBodySchema>;

export class FlashcardsService {
  constructor(private readonly repository: FlashcardsRepository) {}

  private toDto(card: {
    id: string;
    question: string;
    answer: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: card.id,
      question: card.question,
      answer: card.answer,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  async listFlashcards(userId: string, query: ListFlashcardsQuery) {
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
    const card = await this.repository.createFlashcard(userId, randomUUID(), payload);
    if (!card) {
      throw new AppError("Failed to create flashcard", 500, "FLASHCARD_CREATE_FAILED");
    }
    return this.toDto(card);
  }

  async updateFlashcard(userId: string, flashcardId: string, payload: UpdateFlashcardBody) {
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
