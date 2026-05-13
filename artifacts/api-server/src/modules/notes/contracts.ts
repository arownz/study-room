import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const notePermissionSchema = z.enum(["viewer", "editor"]);

export const listNotesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(200).optional(),
  folderId: z.string().min(1).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});
export const noteIdParamsSchema = z.object({
  noteId: z.string().min(1),
});

export const createNoteBodySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(512000).default(""),
  folderId: z.string().min(1).optional(),
});

export const updateNoteBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().max(512000).optional(),
    folderId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.content !== undefined ||
      value.folderId !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const autosaveNoteBodySchema = z.object({
  content: z.string().max(512000),
});

export const noteFolderIdParamsSchema = z.object({
  folderId: z.string().min(1),
});

export const createNoteFolderBodySchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateNoteFolderBodySchema = z.object({
  name: z.string().min(1).max(120),
});

export const noteCollaboratorBodySchema = z.object({
  email: z.string().email(),
  permission: notePermissionSchema.default("viewer"),
});

export const noteCollaboratorParamsSchema = z.object({
  noteId: z.string().min(1),
  collaboratorUserId: z.string().min(1),
});

export const collaboratorUserIdParamsSchema = z.object({
  collaboratorUserId: z.string().min(1),
});

export const noteDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  folderId: z.string().nullable(),
  ownerId: z.string(),
  access: notePermissionSchema.or(z.literal("owner")),
  deletedAt: z.string().nullable(),
  updatedAt: z.string(),
  createdAt: z.string(),
});

export const noteFolderDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const noteCollaboratorDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  permission: notePermissionSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listNotesResponseSchema = z.object({
  items: z.array(noteDtoSchema),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});
export const noteResponseSchema = noteDtoSchema;
export const listNoteFoldersResponseSchema = z.object({
  items: z.array(noteFolderDtoSchema),
});
export const noteFolderResponseSchema = noteFolderDtoSchema;
export const listNoteCollaboratorsResponseSchema = z.object({
  items: z.array(noteCollaboratorDtoSchema),
});

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
export type NoteIdParams = z.infer<typeof noteIdParamsSchema>;
export type CreateNoteBody = z.infer<typeof createNoteBodySchema>;
export type UpdateNoteBody = z.infer<typeof updateNoteBodySchema>;
export type AutosaveNoteBody = z.infer<typeof autosaveNoteBodySchema>;
export type CreateNoteFolderBody = z.infer<typeof createNoteFolderBodySchema>;
export type UpdateNoteFolderBody = z.infer<typeof updateNoteFolderBodySchema>;
export type NoteCollaboratorBody = z.infer<typeof noteCollaboratorBodySchema>;
export type NotePermission = z.infer<typeof notePermissionSchema>;
