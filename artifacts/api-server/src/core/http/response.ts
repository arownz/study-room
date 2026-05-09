import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  } satisfies ApiSuccessResponse<T>);
}

export function sendError(
  res: Response,
  error: string,
  status = 400,
  code?: string,
) {
  return res.status(status).json({
    success: false,
    error,
    code,
  } satisfies ApiErrorResponse);
}
