import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../core/http/response";
import { AppError } from "../../lib/app-error";
import {
  dashboardSummarySchema,
  listUsersResponseSchema,
  meDtoSchema,
  type UpdateMeRequest,
} from "./contracts";
import type { AvatarRequest } from "./avatar-storage";
import {
  detectImageFormat,
  mimeFromFormat,
  publicNoteImageApiUrl,
  type NoteImageRequest,
} from "./note-image-upload";
import { UsersService } from "./service";

export class UsersController {
  constructor(private readonly service: UsersService) {}

  listUsers = async (req: Request, res: Response) => {
    const data = await this.service.listUsers(req.query as never);
    return sendSuccess(res, listUsersResponseSchema.parse(data));
  };

  getMe = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const data = await this.service.getMe(req.authUser.id);
    return sendSuccess(res, meDtoSchema.parse(data));
  };

  getDashboardSummary = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const data = await this.service.getDashboardSummary(req.authUser.id);
    return sendSuccess(res, dashboardSummarySchema.parse(data));
  };

  updateMe = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const data = await this.service.updateMe(
      req.authUser.id,
      req.body as UpdateMeRequest,
    );
    return sendSuccess(res, meDtoSchema.parse(data));
  };

  uploadAvatar = async (req: AvatarRequest, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }

    const file = req.file;
    if (!file?.buffer?.length) {
      throw new AppError("No file uploaded", 400, "NO_FILE");
    }

    const format = detectImageFormat(file.buffer);
    if (!format) {
      throw new AppError(
        "Unsupported image format. Use PNG, JPEG, WebP, or GIF.",
        400,
        "INVALID_IMAGE",
      );
    }

    const updated = await this.service.uploadAvatarFromBuffer(
      req.authUser.id,
      file.buffer,
      mimeFromFormat(format),
    );

    return sendSuccess(res, meDtoSchema.parse(updated));
  };

  deleteAvatar = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }

    const updated = await this.service.deleteAvatar(req.authUser.id);

    return sendSuccess(res, meDtoSchema.parse(updated));
  };

  getUserAvatar = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const { userId } = req.params as { userId: string };
    const resolved = await this.service.resolveAvatarStream(userId);
    if (resolved.kind === "not_found") {
      sendError(res, "Not found", 404, "NOT_FOUND");
      return;
    }
    if (resolved.kind === "redirect") {
      res.redirect(302, resolved.url);
      return;
    }
    res.setHeader("Content-Type", resolved.mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(resolved.data);
  };

  /** Authenticated inline image upload for note HTML (stored in PostgreSQL, not disk). */
  uploadNoteImage = async (req: NoteImageRequest, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const file = req.file;
    if (!file?.buffer?.length) {
      throw new AppError("No image uploaded", 400, "NO_FILE");
    }

    const format = detectImageFormat(file.buffer);
    if (!format) {
      throw new AppError(
        "Unsupported image format. Use PNG, JPEG, WebP, or GIF.",
        400,
        "INVALID_IMAGE",
      );
    }

    const id = await this.service.createNoteImageFromBuffer(
      req.authUser.id,
      file.buffer,
      mimeFromFormat(format),
    );

    return sendSuccess(res, { url: publicNoteImageApiUrl(id) }, 201);
  };

  /** Serve a note image bytea row (same user only; used as `<img src>`). */
  getNoteImage = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const { assetId } = req.params as { assetId: string };
    const row = await this.service.getNoteImageBytesForOwner(assetId, req.authUser.id);
    if (!row) {
      sendError(res, "Not found", 404, "NOT_FOUND");
      return;
    }
    res.setHeader("Content-Type", row.mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(row.data);
  };
}
