import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../core/http/response";
import {
  listUsersResponseSchema,
  meDtoSchema,
  type UpdateMeRequest,
} from "./contracts";
import { UsersService } from "./service";

export class UsersController {
  constructor(private readonly service: UsersService) {}

  listUsers = async (req: Request, res: Response) => {
    const data = await this.service.listUsers(req.query as never);
    return sendSuccess(res, listUsersResponseSchema.parse(data));
  };

  getMe = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const data = await this.service.getMe(req.authUser.id);
    return sendSuccess(res, meDtoSchema.parse(data));
  };

  updateMe = async (req: Request, res: Response) => {
    if (!req.authUser) {
      sendError(res, "Unauthorized", 401, "UNAUTHORIZED");
      return;
    }
    const data = await this.service.updateMe(
      req.authUser.id,
      req.body as UpdateMeRequest,
    );
    return sendSuccess(res, meDtoSchema.parse(data));
  };
}
