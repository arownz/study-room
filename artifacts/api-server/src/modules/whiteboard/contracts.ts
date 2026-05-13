import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

const MAX_SNAPSHOT_BYTES = 512_000;

export const listWhiteboardsQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(200).optional(),
});

export const whiteboardIdParamsSchema = z.object({
  whiteboardId: z.string().min(1),
});

export const createWhiteboardBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const updateWhiteboardBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    snapshot: z.string().max(MAX_SNAPSHOT_BYTES).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.snapshot !== undefined, {
    message: "At least one field must be provided",
  });

export const whiteboardSnapshotBodySchema = z
  .object({
    snapshot: z.string().max(MAX_SNAPSHOT_BYTES),
  })
  .strict();

export const whiteboardDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  snapshot: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listWhiteboardsResponseSchema = z.object({
  items: z.array(whiteboardDtoSchema),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});

export type ListWhiteboardsQuery = z.infer<typeof listWhiteboardsQuerySchema>;
export type WhiteboardIdParams = z.infer<typeof whiteboardIdParamsSchema>;
export type CreateWhiteboardBody = z.infer<typeof createWhiteboardBodySchema>;
export type UpdateWhiteboardBody = z.infer<typeof updateWhiteboardBodySchema>;
export type WhiteboardSnapshotBody = z.infer<typeof whiteboardSnapshotBodySchema>;
export type WhiteboardDto = z.infer<typeof whiteboardDtoSchema>;
