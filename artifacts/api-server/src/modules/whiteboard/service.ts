import { z } from "zod";
import { AppError } from "../../lib/app-error";
import {
  createWhiteboardBodySchema,
  listWhiteboardsResponseSchema,
  updateWhiteboardBodySchema,
  whiteboardDtoSchema,
  type CreateWhiteboardBody,
  type ListWhiteboardsQuery,
  type UpdateWhiteboardBody,
  type WhiteboardDto,
} from "./contracts";
import { WhiteboardRepository } from "./repository";

const MAX_STICKIES = 200;
const MAX_STROKES = 10_000;
const MAX_SHAPES = 5_000;
const MAX_POINTS_PER_STROKE = 12_000;

const stickySchema = z.object({
  id: z.string().min(1).max(64),
  x: z.number().finite(),
  y: z.number().finite(),
  text: z.string().max(4000),
  colorIdx: z.number().int().min(0).max(32),
  rotation: z.number().finite(),
});

const snapshotV1Schema = z
  .object({
    version: z.literal(1),
    zoom: z.number().int().min(40).max(200).optional(),
    stickies: z.array(stickySchema).max(MAX_STICKIES),
  })
  .strict();

const viewportSchema = z.object({
  /** Client may send float zoom from wheel/pinch; coerce to int 40–200. */
  zoom: z.coerce
    .number()
    .finite()
    .transform((v) => Math.min(200, Math.max(40, Math.round(v)))),
  panX: z.number().finite(),
  panY: z.number().finite(),
});

const strokeSchema = z.object({
  id: z.string().min(1).max(128),
  color: z.string().min(1).max(64),
  width: z.number().finite().min(0.25).max(128),
  opacity: z.number().finite().min(0).max(1),
  points: z
    .array(z.tuple([z.number().finite(), z.number().finite()]))
    .max(MAX_POINTS_PER_STROKE),
});

const labelShapeSchema = z
  .object({
    kind: z.literal("label"),
    id: z.string().min(1).max(128),
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite(),
    h: z.number().finite(),
    text: z.string().max(4000),
    color: z.string().max(64),
  })
  .strict();

const lineShapeSchema = z
  .object({
    kind: z.literal("line"),
    id: z.string().min(1).max(128),
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite(),
    h: z.number().finite(),
    stroke: z.string().max(64),
    strokeWidth: z.number().finite().positive().max(128),
  })
  .strict();

const rectShapeSchema = z
  .object({
    kind: z.literal("rect"),
    id: z.string().min(1).max(128),
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite(),
    h: z.number().finite(),
    stroke: z.string().max(64),
    fill: z.string().max(64),
    strokeWidth: z.number().finite().positive().max(128),
  })
  .strict();

const ellipseShapeSchema = z
  .object({
    kind: z.literal("ellipse"),
    id: z.string().min(1).max(128),
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite(),
    h: z.number().finite(),
    stroke: z.string().max(64),
    fill: z.string().max(64),
    strokeWidth: z.number().finite().positive().max(128),
  })
  .strict();

const boardShapeSchema = z.discriminatedUnion("kind", [
  rectShapeSchema,
  ellipseShapeSchema,
  lineShapeSchema,
  labelShapeSchema,
]);

const snapshotV2Schema = z
  .object({
    version: z.literal(2),
    viewport: viewportSchema,
    stickies: z.array(stickySchema).max(MAX_STICKIES),
    strokes: z.array(strokeSchema).max(MAX_STROKES),
    shapes: z.array(boardShapeSchema).max(MAX_SHAPES),
  })
  .strip();

const snapshotPayloadSchema = z.union([snapshotV1Schema, snapshotV2Schema]);
const EMPTY_WHITEBOARD_SNAPSHOT = JSON.stringify({
  version: 2,
  viewport: { zoom: 100, panX: 0, panY: 0 },
  stickies: [],
  strokes: [],
  shapes: [],
});

function toWhiteboardDto(row: {
  id: string;
  title: string;
  snapshot: string;
  createdAt: Date;
  updatedAt: Date;
}): WhiteboardDto {
  return whiteboardDtoSchema.parse({
    id: row.id,
    title: row.title,
    snapshot: row.snapshot,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export class WhiteboardService {
  constructor(private readonly repository: WhiteboardRepository) {}

  private validateSnapshot(snapshot: string): string {
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
    return JSON.stringify(validated.data);
  }

  async list(userId: string, query: ListWhiteboardsQuery) {
    const rows = await this.repository.listByUserId(userId, query);
    return listWhiteboardsResponseSchema.parse({
      items: rows.map(toWhiteboardDto),
      page: {
        limit: query.limit,
        offset: query.offset,
      },
    });
  }

  async getById(userId: string, whiteboardId: string): Promise<WhiteboardDto> {
    const row = await this.repository.getById(userId, whiteboardId);
    if (!row) {
      throw new AppError("Whiteboard not found", 404, "WHITEBOARD_NOT_FOUND");
    }
    return toWhiteboardDto(row);
  }

  async create(userId: string, payload: CreateWhiteboardBody): Promise<WhiteboardDto> {
    const parsed = createWhiteboardBodySchema.parse(payload);
    const row = await this.repository.create(userId, {
      ...parsed,
      title: parsed.title ?? "Untitled Whiteboard",
      snapshot: EMPTY_WHITEBOARD_SNAPSHOT,
    });
    if (!row) {
      throw new AppError("Failed to create whiteboard", 500, "INTERNAL_ERROR");
    }
    return toWhiteboardDto(row);
  }

  async update(userId: string, whiteboardId: string, payload: UpdateWhiteboardBody): Promise<WhiteboardDto> {
    const parsed = updateWhiteboardBodySchema.parse(payload);
    const nextPayload: UpdateWhiteboardBody = {
      ...parsed,
      ...(parsed.snapshot !== undefined ? { snapshot: this.validateSnapshot(parsed.snapshot) } : {}),
    };
    const row = await this.repository.update(userId, whiteboardId, nextPayload);
    if (!row) {
      throw new AppError("Whiteboard not found", 404, "WHITEBOARD_NOT_FOUND");
    }
    return toWhiteboardDto(row);
  }

  async remove(userId: string, whiteboardId: string): Promise<void> {
    const deleted = await this.repository.delete(userId, whiteboardId);
    if (!deleted) {
      throw new AppError("Whiteboard not found", 404, "WHITEBOARD_NOT_FOUND");
    }
  }

  async getMine(userId: string): Promise<WhiteboardDto> {
    const row = await this.repository.getMostRecentlyUpdated(userId);
    if (!row) {
      return whiteboardDtoSchema.parse({
        id: "unsaved",
        title: "Untitled Whiteboard",
        snapshot: EMPTY_WHITEBOARD_SNAPSHOT,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      });
    }
    return toWhiteboardDto(row);
  }

  async saveMine(userId: string, snapshot: string): Promise<WhiteboardDto> {
    const normalized = this.validateSnapshot(snapshot);
    const latest = await this.repository.getMostRecentlyUpdated(userId);
    if (latest) {
      const updated = await this.repository.update(userId, latest.id, { snapshot: normalized });
      if (!updated) {
        throw new AppError("Failed to persist whiteboard", 500, "INTERNAL_ERROR");
      }
      return toWhiteboardDto(updated);
    }
    const row = await this.repository.create(userId, {
      title: "Untitled Whiteboard",
      snapshot: normalized,
    });
    if (!row) {
      throw new AppError("Failed to persist whiteboard", 500, "INTERNAL_ERROR");
    }
    return toWhiteboardDto(row);
  }
}
