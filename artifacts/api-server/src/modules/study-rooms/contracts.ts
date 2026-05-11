import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const listStudyRoomsQuerySchema = paginationQuerySchema;
export const studyRoomIdParamsSchema = z.object({
  roomId: z.string().min(1),
});

export const createStudyRoomBodySchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean().optional().default(false),
});

export const updateStudyRoomBodySchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    description: z.string().max(2000).nullable().optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.isPublic !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const studyRoomDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listStudyRoomsResponseSchema = z.object({
  items: z.array(studyRoomDtoSchema),
});

export const studyRoomGoalIdParamsSchema = z.object({
  roomId: z.string().min(1),
  goalId: z.string().min(1),
});

export const createStudyRoomGoalBodySchema = z.object({
  text: z.string().min(1).max(500),
});

export const updateStudyRoomGoalBodySchema = z
  .object({
    text: z.string().min(1).max(500).optional(),
    done: z.boolean().optional(),
  })
  .refine((v) => v.text !== undefined || v.done !== undefined, {
    message: "At least one field must be provided",
  });

export const studyRoomGoalDtoSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  text: z.string(),
  done: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listStudyRoomGoalsResponseSchema = z.object({
  items: z.array(studyRoomGoalDtoSchema),
});

export const studyRoomTimerPhaseSchema = z.enum(["idle", "focus", "break"]);

export const patchStudyRoomTimerBodySchema = z
  .object({
    phase: studyRoomTimerPhaseSchema.optional(),
    durationSec: z.number().int().min(60).max(7200).optional(),
    remainingSec: z.number().int().min(0).max(7200).optional(),
    running: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.phase !== undefined ||
      v.durationSec !== undefined ||
      v.remainingSec !== undefined ||
      v.running !== undefined,
    { message: "At least one field must be provided" },
  );

export const studyRoomTimerDtoSchema = z.object({
  phase: studyRoomTimerPhaseSchema,
  durationSec: z.number().int().nullable(),
  remainingSec: z.number().int(),
  running: z.boolean(),
  leaderUserId: z.string().nullable(),
  anchorEndsAt: z.string().nullable(),
  updatedAt: z.string(),
});
