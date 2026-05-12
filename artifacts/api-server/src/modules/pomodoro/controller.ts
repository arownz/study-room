import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import {
  listPomodoroSessionsResponseSchema,
  pomodoroPreferencesDtoSchema,
  pomodoroSessionDtoSchema,
} from "./contracts";
import { PomodoroService } from "./service";

export class PomodoroController {
  constructor(private readonly service: PomodoroService) {}

  listSessions = async (req: Request, res: Response) => {
    const data = await this.service.listSessions(req.authUser!.id, req.query as never);
    return sendSuccess(res, listPomodoroSessionsResponseSchema.parse(data));
  };

  createSession = async (req: Request, res: Response) => {
    const data = await this.service.createSession(req.authUser!.id, req.body);
    return sendSuccess(res, pomodoroSessionDtoSchema.parse(data), 201);
  };

  getPreferences = async (req: Request, res: Response) => {
    const data = await this.service.getPreferences(req.authUser!.id);
    return sendSuccess(res, pomodoroPreferencesDtoSchema.parse(data));
  };

  putPreferences = async (req: Request, res: Response) => {
    const data = await this.service.putPreferences(req.authUser!.id, req.body);
    return sendSuccess(res, pomodoroPreferencesDtoSchema.parse(data));
  };
}
