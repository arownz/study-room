import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const pomodoroModeSchema = z.enum(["focus", "short_break", "long_break"]);

export const createPomodoroSessionBodySchema = z.object({
  mode: pomodoroModeSchema,
  durationPlannedSec: z.number().int().positive().max(24 * 60 * 60),
  durationActualSec: z.number().int().positive().max(24 * 60 * 60),
  label: z.string().max(500).optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

export const listPomodoroSessionsQuerySchema = paginationQuerySchema.extend({
  mode: pomodoroModeSchema.optional(),
});

export const pomodoroSessionDtoSchema = z.object({
  id: z.string().min(1),
  mode: pomodoroModeSchema,
  durationPlannedSec: z.number().int().nonnegative(),
  durationActualSec: z.number().int().nonnegative(),
  label: z.string().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const listPomodoroSessionsResponseSchema = z.object({
  items: z.array(pomodoroSessionDtoSchema),
  limit: z.number().int(),
  offset: z.number().int(),
});

export type PomodoroSessionDto = z.infer<typeof pomodoroSessionDtoSchema>;
export type CreatePomodoroSessionBody = z.infer<typeof createPomodoroSessionBodySchema>;
export type ListPomodoroSessionsQuery = z.infer<typeof listPomodoroSessionsQuerySchema>;
