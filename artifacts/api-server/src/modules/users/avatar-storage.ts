import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import type { Request } from "express";
import { env } from "../../config/env";

const UPLOAD_ROOT = resolve(process.cwd(), "uploads");
const AVATAR_DIR = join(UPLOAD_ROOT, "avatars");

mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.authUser?.id ?? "anon";
    const ext = (extname(file.originalname || "") || ".png").toLowerCase();
    cb(null, `${userId}-${randomUUID()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Only PNG, JPG, WEBP and GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function buildAvatarPublicUrl(filename: string): string {
  const base = env.API_ORIGIN.replace(/\/$/, "");
  return `${base}/uploads/avatars/${filename}`;
}

export function avatarFilenameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/uploads\/avatars\/([^/?#]+)$/);
  return match ? match[1] : null;
}

export async function deleteAvatarFile(filename: string): Promise<void> {
  const full = join(AVATAR_DIR, filename);
  try {
    await unlink(full);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export const AVATAR_UPLOAD_ROOT = UPLOAD_ROOT;

export interface MulterError extends Error {
  code?: string;
}

export type AvatarRequest = Request & { file?: Express.Multer.File };
