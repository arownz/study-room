import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const listFlashcardDecksQuerySchema = paginationQuerySchema;

export const flashcardDeckIdParamsSchema = z.object({
  deckId: z.string().min(1),
});

export const createFlashcardDeckBodySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).nullable().optional(),
});

export const updateFlashcardDeckBodySchema = z
  .object({
    title: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined, {
    message: "At least one field must be provided",
  });

export const flashcardDeckDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listFlashcardDecksResponseSchema = z.object({
  items: z.array(flashcardDeckDtoSchema),
});

export const flashcardDeckStatsSchema = z.object({
  cardCount: z.number().int().nonnegative(),
  lastCardUpdatedAt: z.string().nullable(),
});
