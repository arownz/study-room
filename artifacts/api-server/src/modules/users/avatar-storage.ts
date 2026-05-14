import type { Request } from "express";
import multer from "multer";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Only PNG, JPG, WEBP and GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export interface MulterError extends Error {
  code?: string;
}

export type AvatarRequest = Request & { file?: Express.Multer.File };
