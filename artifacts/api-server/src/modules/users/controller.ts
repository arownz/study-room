import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { listUsersResponseSchema } from "./contracts";
import { UsersService } from "./service";

export class UsersController {
  constructor(private readonly service: UsersService) {}

  listUsers = async (req: Request, res: Response) => {
    const data = await this.service.listUsers(req.query as never);
    return sendSuccess(res, listUsersResponseSchema.parse(data));
  };
}
