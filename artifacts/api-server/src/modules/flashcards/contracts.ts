import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const listFlashcardsQuerySchema = paginationQuerySchema.extend({
  deckId: z.string().min(1).optional(),
});
export const flashcardIdParamsSchema = z.object({
  flashcardId: z.string().min(1),
});

export const createFlashcardBodySchema = z.object({
  deckId: z.string().min(1),
  question: z.string().min(1).max(200_000),
  answer: z.string().min(1).max(200_000),
});

export const updateFlashcardBodySchema = z
  .object({
    deckId: z.string().min(1).optional(),
    question: z.string().min(1).max(200_000).optional(),
    answer: z.string().min(1).max(200_000).optional(),
  })
  .refine(
    (value) =>
      value.question !== undefined ||
      value.answer !== undefined ||
      value.deckId !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const flashcardDtoSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  question: z.string(),
  answer: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listFlashcardsResponseSchema = z.object({
  items: z.array(flashcardDtoSchema),
});
