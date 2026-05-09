import type { RequestHandler } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { AppError } from "../../lib/app-error";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

// Express 5 defines req.query as a getter-only property via Object.defineProperty,
// so direct assignment (`req.query = ...`) throws a TypeError.
// We must use Object.defineProperty to override it.
function overrideQuery(req: Parameters<RequestHandler>[0], value: unknown) {
  Object.defineProperty(req, "query", {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        overrideQuery(req, schemas.query.parse(req.query));
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((issue) => issue.message).join("; ");
        next(new AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
        return;
      }
      next(error);
    }
  };
}
