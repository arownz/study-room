import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../core/http/response";
import { AuthService } from "./service";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  getMe = (req: Request, res: Response) => {
    if (!req.authSession || !req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }

    const data = this.service.getAuthMe(req.authUser, req.authSession);
    sendSuccess(res, data);
  };
}
