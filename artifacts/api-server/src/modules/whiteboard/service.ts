import { z } from "zod";
import { AppError } from "../../lib/app-error";
import { whiteboardDtoSchema, type WhiteboardDto } from "./contracts";
import { WhiteboardRepository } from "./repository";

const MAX_STICKIES = 200;

const stickySchema = z.object({
  id: z.string().min(1).max(64),
  x: z.number().finite(),
  y: z.number().finite(),
  text: z.string().max(4000),
  colorIdx: z.number().int().min(0).max(32),
  rotation: z.number().finite(),
});

const snapshotPayloadSchema = z
  .object({
    version: z.literal(1),
    zoom: z.number().int().min(40).max(200).optional(),
    stickies: z.array(stickySchema).max(MAX_STICKIES),
  })
  .strict();

export class WhiteboardService {
  constructor(private readonly repository: WhiteboardRepository) {}

  async getOrEmpty(userId: string): Promise<WhiteboardDto> {
    const row = await this.repository.getByUserId(userId);
    if (!row) {
      return whiteboardDtoSchema.parse({
        snapshot: JSON.stringify({ version: 1, zoom: 100, stickies: [] }),
        updatedAt: new Date(0).toISOString(),
      });
    }
    return whiteboardDtoSchema.parse({
      snapshot: row.snapshot,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  async saveSnapshot(userId: string, snapshot: string): Promise<WhiteboardDto> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(snapshot) as unknown;
    } catch {
      throw new AppError("snapshot must be valid JSON", 400, "VALIDATION_ERROR");
    }
    const validated = snapshotPayloadSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AppError("Invalid whiteboard snapshot shape", 400, "VALIDATION_ERROR");
    }
    const normalized = JSON.stringify(validated.data);
    const row = await this.repository.upsertSnapshot(userId, normalized);
    if (!row) {
      throw new AppError("Failed to persist whiteboard", 500, "INTERNAL_ERROR");
    }
    return whiteboardDtoSchema.parse({
      snapshot: row.snapshot,
      updatedAt: row.updatedAt.toISOString(),
    });
  }
}
