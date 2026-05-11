import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const aiTemplateKeySchema = z.enum([
  "explain_concept",
  "step_by_step",
  "quiz_me",
  "essay_outline",
  "mnemonic",
]);

export type AiTemplateKey = z.infer<typeof aiTemplateKeySchema>;

export const createAiThreadBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const threadIdParamsSchema = z.object({
  threadId: z.string().min(1),
});

export const listAiThreadsQuerySchema = paginationQuerySchema;

export const appendAiMessageBodySchema = z.object({
  content: z.string().min(1).max(100_000),
  templateKey: aiTemplateKeySchema.optional(),
});

export const aiThreadDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const aiMessageDtoSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  templateKey: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const listAiThreadsResponseSchema = z.object({
  items: z.array(aiThreadDtoSchema),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const listAiMessagesResponseSchema = z.object({
  items: z.array(aiMessageDtoSchema),
});

export const appendAiMessageResponseSchema = z.object({
  userMessage: aiMessageDtoSchema,
  assistantMessage: aiMessageDtoSchema,
});

export type AiThreadDto = z.infer<typeof aiThreadDtoSchema>;
export type AiMessageDto = z.infer<typeof aiMessageDtoSchema>;
