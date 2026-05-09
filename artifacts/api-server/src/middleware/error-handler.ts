import type { NextFunction, Request, Response } from "express";
import { sendError } from "../core/http/response";
import { AppError } from "../lib/app-error";
import { logger } from "../lib/logger";

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

  logger.error({ err: error }, "Unhandled server error");
  sendError(res, "Internal server error", 500, "INTERNAL_ERROR");
}
