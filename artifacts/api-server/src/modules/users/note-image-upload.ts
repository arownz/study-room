import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { open } from "node:fs/promises";
import multer from "multer";
import type { Request } from "express";
import { AppError } from "../../lib/app-error";

const UPLOAD_ROOT = resolve(process.cwd(), "uploads");
export const NOTE_IMAGE_DIR = join(UPLOAD_ROOT, "note-images");

mkdirSync(NOTE_IMAGE_DIR, { recursive: true });

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export type NoteImageFormat = "png" | "jpeg" | "webp" | "gif";

export function extensionForFormat(format: NoteImageFormat): string {
  switch (format) {
    case "png":
      return ".png";
    case "jpeg":
      return ".jpg";
    case "webp":
      return ".webp";
    case "gif":
      return ".gif";
    default:
      return ".png";
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

export async function readFilePrefix(filePath: string, byteLength: number): Promise<Buffer> {
  const fh = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(byteLength);
    const { bytesRead } = await fh.read(buf, 0, byteLength, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, NOTE_IMAGE_DIR);
  },
  filename: (req, _file, cb) => {
    const userId = req.authUser?.id ?? "anon";
    cb(null, `${userId}-note-${randomUUID()}.upload`);
  },
});

export const noteImageUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const mt = (file.mimetype || "").toLowerCase();

    if (ALLOWED_MIME.has(mt)) {
      cb(null, true);
      return;
    }

    // Pasted / dropped blobs often report octet-stream or empty MIME until sniffed server-side.
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

/** Browser-loadable URL (same origin as API in prod, or proxied `/uploads` in Vite dev). */
export function publicNoteImageUrl(filename: string): string {
  return `/uploads/note-images/${filename}`;
}

export type NoteImageRequest = Request & { file?: Express.Multer.File };
