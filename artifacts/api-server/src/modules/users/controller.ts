import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { rename, unlink } from "node:fs/promises";
import { sendError, sendSuccess } from "../../core/http/response";
import { AppError } from "../../lib/app-error";
import {
  listUsersResponseSchema,
  meDtoSchema,
  type UpdateMeRequest,
} from "./contracts";
import {
  avatarFilenameFromUrl,
  buildAvatarPublicUrl,
  deleteAvatarFile,
  type AvatarRequest,
} from "./avatar-storage";
import {
  detectImageFormat,
  extensionForFormat,
  publicNoteImageUrl,
  readFilePrefix,
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
    if (!file) {
      throw new AppError("No file uploaded", 400, "NO_FILE");
    }

    // Best-effort cleanup of the previous self-hosted avatar so we
    // don't leak storage between successive uploads.
    const previous = await this.service.getMe(req.authUser.id);
    const previousFilename = avatarFilenameFromUrl(previous.avatar);

    const url = buildAvatarPublicUrl(file.filename);
    const updated = await this.service.setAvatar(req.authUser.id, url);

    if (previousFilename && previousFilename !== file.filename) {
      void deleteAvatarFile(previousFilename).catch(() => undefined);
    }

    return sendSuccess(res, meDtoSchema.parse(updated));
  };

  deleteAvatar = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }

    const previous = await this.service.getMe(req.authUser.id);
    const filename = avatarFilenameFromUrl(previous.avatar);

    const updated = await this.service.setAvatar(req.authUser.id, null);

    if (filename) {
      void deleteAvatarFile(filename).catch(() => undefined);
    }

    return sendSuccess(res, meDtoSchema.parse(updated));
  };

  /** Authenticated inline image upload for note HTML (editor paste / upload). */
  uploadNoteImage = async (req: NoteImageRequest, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const file = req.file;
    if (!file) {
      throw new AppError("No image uploaded", 400, "NO_FILE");
    }

    let prefix: Buffer;
    try {
      prefix = await readFilePrefix(file.path, 16);
    } catch {
      await unlink(file.path).catch(() => undefined);
      throw new AppError("Could not read the uploaded image.", 400, "READ_FAILED");
    }

    const format = detectImageFormat(prefix);
    if (!format) {
      await unlink(file.path).catch(() => undefined);
      throw new AppError(
        "Unsupported image format. Use PNG, JPEG, WebP, or GIF.",
        400,
        "INVALID_IMAGE",
      );
    }

    const dir = dirname(file.path);
    const destName = `${req.authUser.id}-note-${randomUUID()}${extensionForFormat(format)}`;
    const destPath = join(dir, destName);

    try {
      await rename(file.path, destPath);
    } catch {
      await unlink(file.path).catch(() => undefined);
      throw new AppError("Failed to store the image.", 500, "STORE_FAILED");
    }

    return sendSuccess(res, { url: publicNoteImageUrl(destName) });
  };
}
