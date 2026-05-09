import type { NextFunction, Request, Response } from "express";
import { sendError } from "../../core/http/response";
import { getRequestSession } from "./session-service";

export async function attachAuthSession(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authSession = await getRequestSession(req);
    if (authSession) {
      req.authSession = authSession.session;
      req.authUser = authSession.user;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authSession = await getRequestSession(req);
    if (!authSession) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }

    req.authSession = authSession.session;
    req.authUser = authSession.user;
    next();
  } catch (error) {
    next(error);
  }
}
