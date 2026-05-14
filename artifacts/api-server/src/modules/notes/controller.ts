import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import {
  listNoteCollaboratorsResponseSchema,
  listNoteFoldersResponseSchema,
  listNotesResponseSchema,
  noteFolderResponseSchema,
  noteResponseSchema,
} from "./contracts";
import { NotesService } from "./service";

export class NotesController {
  constructor(private readonly service: NotesService) {}

  listNotes = async (req: Request, res: Response) => {
    const data = await this.service.listNotes(req.authUser!.id, req.query as never);
    return sendSuccess(res, listNotesResponseSchema.parse(data));
  };

  getNoteById = async (req: Request, res: Response) => {
    const { noteId } = req.params as { noteId: string };
    const data = await this.service.getNoteById(req.authUser!.id, noteId);
    return sendSuccess(res, noteResponseSchema.parse(data));
  };

  createNote = async (req: Request, res: Response) => {
    const data = await this.service.createNote(req.authUser!.id, req.body);
    return sendSuccess(res, noteResponseSchema.parse(data), 201);
  };

  updateNote = async (req: Request, res: Response) => {
    const { noteId } = req.params as { noteId: string };
    const data = await this.service.updateNote(req.authUser!.id, noteId, req.body);
    return sendSuccess(res, noteResponseSchema.parse(data));
  };

  deleteNote = async (req: Request, res: Response) => {
    const { noteId } = req.params as { noteId: string };
    const data = await this.service.deleteNote(req.authUser!.id, noteId);
    return sendSuccess(res, data);
  };

  autosaveNote = async (req: Request, res: Response) => {
    const { noteId } = req.params as { noteId: string };
    const data = await this.service.autosaveNote(req.authUser!.id, noteId, req.body);
    return sendSuccess(res, noteResponseSchema.parse(data));
  };

  listFolders = async (req: Request, res: Response) => {
    const data = await this.service.listFolders(req.authUser!.id);
    return sendSuccess(res, listNoteFoldersResponseSchema.parse(data));
  };

  createFolder = async (req: Request, res: Response) => {
    const data = await this.service.createFolder(req.authUser!.id, req.body);
    return sendSuccess(res, noteFolderResponseSchema.parse(data), 201);
  };

  updateFolder = async (req: Request, res: Response) => {
    const { folderId } = req.params as { folderId: string };
    const data = await this.service.updateFolder(req.authUser!.id, folderId, req.body);
    return sendSuccess(res, noteFolderResponseSchema.parse(data));
  };

  deleteFolder = async (req: Request, res: Response) => {
    const { folderId } = req.params as { folderId: string };
    const data = await this.service.deleteFolder(req.authUser!.id, folderId);
    return sendSuccess(res, data);
  };

  listCollaborators = async (req: Request, res: Response) => {
    const { noteId } = req.params as { noteId: string };
    const data = await this.service.listCollaborators(req.authUser!.id, noteId);
    return sendSuccess(res, listNoteCollaboratorsResponseSchema.parse(data));
  };

  upsertCollaborator = async (req: Request, res: Response) => {
    const { noteId } = req.params as { noteId: string };
    const data = await this.service.upsertCollaborator(req.authUser!.id, noteId, req.body);
    return sendSuccess(res, listNoteCollaboratorsResponseSchema.parse(data));
  };

  removeCollaborator = async (req: Request, res: Response) => {
    const params = req.params as { noteId: string; collaboratorUserId: string };
    const data = await this.service.removeCollaborator(
      req.authUser!.id,
      params.noteId,
      params.collaboratorUserId,
    );
    return sendSuccess(res, data);
  };
}
