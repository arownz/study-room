import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { AiService } from "./service";

export class AiController {
  constructor(private readonly service: AiService) {}

  listAiJobs = async (req: Request, res: Response) => {
    const data = await this.service.listAiJobs(req.query as never);
    return sendSuccess(res, data);
  };
}
