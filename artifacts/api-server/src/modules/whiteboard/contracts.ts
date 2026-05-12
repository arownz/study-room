import { z } from "zod";

const MAX_SNAPSHOT_BYTES = 512_000;

export const whiteboardSnapshotBodySchema = z
  .object({
    snapshot: z.string().max(MAX_SNAPSHOT_BYTES),
  })
  .strict();

export const whiteboardDtoSchema = z.object({
  snapshot: z.string(),
  updatedAt: z.string().datetime(),
});

export type WhiteboardSnapshotBody = z.infer<typeof whiteboardSnapshotBodySchema>;
export type WhiteboardDto = z.infer<typeof whiteboardDtoSchema>;
