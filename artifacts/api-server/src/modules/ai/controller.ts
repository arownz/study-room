import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { AiService } from "./service";

export class AiController {
  constructor(private readonly service: AiService) {}

  listAiJobs = async (req: Request, res: Response) => {
    const data = await this.service.listAiJobs(req.query as never);
    return sendSuccess(res, data);
  };

  createThread = async (req: Request, res: Response) => {
    const data = await this.service.createThread(req.authUser!.id, req.body);
    return sendSuccess(res, data, 201);
  };

  listThreads = async (req: Request, res: Response) => {
    const data = await this.service.listThreads(req.authUser!.id, req.query as never);
    return sendSuccess(res, data);
  };

  listMessages = async (req: Request, res: Response) => {
    const { threadId } = req.params as { threadId: string };
    const data = await this.service.listMessages(req.authUser!.id, threadId);
    return sendSuccess(res, data);
  };

  appendMessage = async (req: Request, res: Response) => {
    const { threadId } = req.params as { threadId: string };
    const data = await this.service.appendMessage(req.authUser!.id, threadId, req.body);
    return sendSuccess(res, data);
  };
}
