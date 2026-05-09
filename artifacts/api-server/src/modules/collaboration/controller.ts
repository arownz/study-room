import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { CollaborationService } from "./service";

export class CollaborationController {
  constructor(private readonly service: CollaborationService) {}

  listSessions = async (req: Request, res: Response) => {
    const data = await this.service.listSessions(req.query as never);
    return sendSuccess(res, data);
  };
}
