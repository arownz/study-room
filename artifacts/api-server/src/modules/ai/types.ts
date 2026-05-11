import type { z } from "zod";
import type { appendAiMessageBodySchema, createAiThreadBodySchema } from "./contracts";

export type CreateAiThreadBody = z.infer<typeof createAiThreadBodySchema>;
export type AppendAiMessageBody = z.infer<typeof appendAiMessageBodySchema>;
