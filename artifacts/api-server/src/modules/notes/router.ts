import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { NotesController } from "./controller";
import {
  autosaveNoteBodySchema,
  collaboratorUserIdParamsSchema,
  createNoteFolderBodySchema,
  noteCollaboratorBodySchema,
  createNoteBodySchema,
  listNotesQuerySchema,
  noteFolderIdParamsSchema,
  noteIdParamsSchema,
  updateNoteFolderBodySchema,
  updateNoteBodySchema,
} from "./contracts";
import { NotesRepository } from "./repository";
import { NotesService } from "./service";

const router: IRouter = Router();
const repository = new NotesRepository();
const service = new NotesService(repository);
const controller = new NotesController(service);

router.get(
  "/notes",
  requireAuth,
  validateRequest({ query: listNotesQuerySchema }),
  asyncHandler(controller.listNotes),
);
router.get(
  "/notes/:noteId",
  requireAuth,
  validateRequest({ params: noteIdParamsSchema }),
  asyncHandler(controller.getNoteById),
);
router.post(
  "/notes",
  requireAuth,
  validateRequest({ body: createNoteBodySchema }),
  asyncHandler(controller.createNote),
);
router.patch(
  "/notes/:noteId",
  requireAuth,
  validateRequest({ params: noteIdParamsSchema, body: updateNoteBodySchema }),
  asyncHandler(controller.updateNote),
);
router.patch(
  "/notes/:noteId/autosave",
  requireAuth,
  validateRequest({ params: noteIdParamsSchema, body: autosaveNoteBodySchema }),
  asyncHandler(controller.autosaveNote),
);
router.delete(
  "/notes/:noteId",
  requireAuth,
  validateRequest({ params: noteIdParamsSchema }),
  asyncHandler(controller.deleteNote),
);
router.get("/note-folders", requireAuth, asyncHandler(controller.listFolders));
router.post(
  "/note-folders",
  requireAuth,
  validateRequest({ body: createNoteFolderBodySchema }),
  asyncHandler(controller.createFolder),
);
router.patch(
  "/note-folders/:folderId",
  requireAuth,
  validateRequest({ params: noteFolderIdParamsSchema, body: updateNoteFolderBodySchema }),
  asyncHandler(controller.updateFolder),
);
router.delete(
  "/note-folders/:folderId",
  requireAuth,
  validateRequest({ params: noteFolderIdParamsSchema }),
  asyncHandler(controller.deleteFolder),
);
router.get(
  "/notes/:noteId/collaborators",
  requireAuth,
  validateRequest({ params: noteIdParamsSchema }),
  asyncHandler(controller.listCollaborators),
);
router.post(
  "/notes/:noteId/collaborators",
  requireAuth,
  validateRequest({ params: noteIdParamsSchema, body: noteCollaboratorBodySchema }),
  asyncHandler(controller.upsertCollaborator),
);
router.delete(
  "/notes/:noteId/collaborators/:collaboratorUserId",
  requireAuth,
  validateRequest({
    params: noteIdParamsSchema.merge(collaboratorUserIdParamsSchema),
  }),
  asyncHandler(controller.removeCollaborator),
);

export default router;
