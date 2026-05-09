import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const listFlashcardsQuerySchema = paginationQuerySchema;
export const flashcardIdParamsSchema = z.object({
  flashcardId: z.string().min(1),
});

export const createFlashcardBodySchema = z.object({
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(10000),
});

export const updateFlashcardBodySchema = z
  .object({
    question: z.string().min(1).max(1000).optional(),
    answer: z.string().min(1).max(10000).optional(),
  })
  .refine((value) => value.question !== undefined || value.answer !== undefined, {
    message: "At least one field must be provided",
  });

export const flashcardDtoSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listFlashcardsResponseSchema = z.object({
  items: z.array(flashcardDtoSchema),
});
