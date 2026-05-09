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
