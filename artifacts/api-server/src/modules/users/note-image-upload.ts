import multer from "multer";
import type { Request } from "express";
import { AppError } from "../../lib/app-error";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const MAX_NOTE_IMAGE_BYTES = 5 * 1024 * 1024;

export type NoteImageFormat = "png" | "jpeg" | "webp" | "gif";

export function mimeFromFormat(format: NoteImageFormat): string {
  switch (format) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

/** Sniff PNG / JPEG / GIF / WebP from magic bytes (clipboard uploads often lack MIME). */
export function detectImageFormat(buffer: Buffer): NoteImageFormat | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  const gifSig = buffer.subarray(0, 6).toString("latin1");
  if (gifSig === "GIF87a" || gifSig === "GIF89a") {
    return "gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/** Public URL for inline `<img src>` after POST (served from DB via GET). */
export function publicNoteImageApiUrl(assetId: string): string {
  return `/api/v1/note-images/${assetId}`;
}

export const noteImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_NOTE_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    const mt = (file.mimetype || "").toLowerCase();

    if (ALLOWED_MIME.has(mt)) {
      cb(null, true);
      return;
    }

    if (mt === "" || mt === "application/octet-stream") {
      cb(null, true);
      return;
    }

    if (mt.startsWith("image/")) {
      cb(
        new AppError(
          "This image type is not supported. Use PNG, JPEG, WebP, or GIF (convert HEIC if needed).",
          400,
          "UNSUPPORTED_IMAGE_TYPE",
        ),
      );
      return;
    }

    cb(new AppError("Only image uploads are allowed.", 400, "INVALID_UPLOAD"));
  },
});

export type NoteImageRequest = Request & { file?: Express.Multer.File };
