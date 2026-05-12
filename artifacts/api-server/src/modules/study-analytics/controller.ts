import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { studyAnalyticsSchema } from "./contracts";
import { StudyAnalyticsService } from "./service";

export class StudyAnalyticsController {
  constructor(private readonly service: StudyAnalyticsService) {}

  getMine = async (req: Request, res: Response) => {
    const data = await this.service.getForUser(req.authUser!.id, req.query as never);
    return sendSuccess(res, studyAnalyticsSchema.parse(data));
  };
}
