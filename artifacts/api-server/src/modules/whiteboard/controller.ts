import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import {
  listWhiteboardsResponseSchema,
  whiteboardDtoSchema,
  type CreateWhiteboardBody,
  type ListWhiteboardsQuery,
  type UpdateWhiteboardBody,
} from "./contracts";
import { WhiteboardService } from "./service";

export class WhiteboardController {
  constructor(private readonly service: WhiteboardService) {}

  list = async (req: Request, res: Response) => {
    const data = await this.service.list(req.authUser!.id, req.query as ListWhiteboardsQuery);
    return sendSuccess(res, listWhiteboardsResponseSchema.parse(data));
  };

  getById = async (req: Request, res: Response) => {
    const data = await this.service.getById(req.authUser!.id, req.params.whiteboardId);
    return sendSuccess(res, whiteboardDtoSchema.parse(data));
  };

  create = async (req: Request, res: Response) => {
    const data = await this.service.create(req.authUser!.id, req.body as CreateWhiteboardBody);
    return sendSuccess(res, whiteboardDtoSchema.parse(data), 201);
  };

  update = async (req: Request, res: Response) => {
    const data = await this.service.update(
      req.authUser!.id,
      req.params.whiteboardId,
      req.body as UpdateWhiteboardBody,
    );
    return sendSuccess(res, whiteboardDtoSchema.parse(data));
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.authUser!.id, req.params.whiteboardId);
    return sendSuccess(res, { id: req.params.whiteboardId });
  };

  getMine = async (req: Request, res: Response) => {
    const data = await this.service.getMine(req.authUser!.id);
    return sendSuccess(res, whiteboardDtoSchema.parse(data));
  };

  putMine = async (req: Request, res: Response) => {
    const data = await this.service.saveMine(req.authUser!.id, req.body.snapshot);
    return sendSuccess(res, whiteboardDtoSchema.parse(data));
  };
}
