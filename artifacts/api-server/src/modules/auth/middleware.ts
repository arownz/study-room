import type { NextFunction, Request, Response } from "express";
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
      res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
      return;
    }

    req.authSession = authSession.session;
    req.authUser = authSession.user;
    next();
  } catch (error) {
    next(error);
  }
}
