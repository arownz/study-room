import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { sendError } from "../core/http/response";
import { AppError } from "../lib/app-error";
import { logger } from "../lib/logger";

const MulterError = multer.MulterError;

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, error.code);
    return;
  }

  if (error instanceof MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image exceeds maximum size (5 MB)."
        : error.message;
    sendError(res, message, 400, error.code);
    return;
  }

  logger.error({ err: error }, "Unhandled server error");
  sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
}
