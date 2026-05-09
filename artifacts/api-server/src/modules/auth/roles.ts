import type { NextFunction, Request, Response } from "express";
import { requireAuth } from "./middleware";

export const AUTH_ROLES = ["student", "tutor", "admin"] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export function requireRole(role: AuthRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await requireAuth(req, res, async (error) => {
      if (error) {
        next(error);
        return;
      }

      const userRole = (req.authUser as { role?: string } | undefined)?.role;
      if (userRole !== role) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
        });
        return;
      }
      next();
    });
  };
}
