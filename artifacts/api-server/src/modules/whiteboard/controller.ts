import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { whiteboardDtoSchema } from "./contracts";
import { WhiteboardService } from "./service";

export class WhiteboardController {
  constructor(private readonly service: WhiteboardService) {}

  getMine = async (req: Request, res: Response) => {
    const data = await this.service.getOrEmpty(req.authUser!.id);
    return sendSuccess(res, whiteboardDtoSchema.parse(data));
  };

  putMine = async (req: Request, res: Response) => {
    const data = await this.service.saveSnapshot(req.authUser!.id, req.body.snapshot);
    return sendSuccess(res, whiteboardDtoSchema.parse(data));
  };
}
