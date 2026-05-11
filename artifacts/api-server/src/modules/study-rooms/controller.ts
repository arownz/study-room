import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import {
  listStudyRoomGoalsResponseSchema,
  listStudyRoomsResponseSchema,
  studyRoomDtoSchema,
  studyRoomGoalDtoSchema,
  studyRoomTimerDtoSchema,
} from "./contracts";
import { StudyRoomsService } from "./service";

export class StudyRoomsController {
  constructor(private readonly service: StudyRoomsService) {}

  listStudyRooms = async (req: Request, res: Response) => {
    const data = await this.service.listStudyRooms(req.authUser!.id, req.query as never);
    return sendSuccess(res, listStudyRoomsResponseSchema.parse(data));
  };

  getStudyRoomById = async (req: Request, res: Response) => {
    const data = await this.service.getStudyRoomById(req.authUser!.id, req.params.roomId);
    return sendSuccess(res, studyRoomDtoSchema.parse(data));
  };

  createStudyRoom = async (req: Request, res: Response) => {
    const data = await this.service.createStudyRoom(req.authUser!.id, req.body);
    return sendSuccess(res, studyRoomDtoSchema.parse(data), 201);
  };

  updateStudyRoom = async (req: Request, res: Response) => {
    const data = await this.service.updateStudyRoom(req.authUser!.id, req.params.roomId, req.body);
    return sendSuccess(res, studyRoomDtoSchema.parse(data));
  };

  deleteStudyRoom = async (req: Request, res: Response) => {
    const data = await this.service.deleteStudyRoom(req.authUser!.id, req.params.roomId);
    return sendSuccess(res, data);
  };

  listGoals = async (req: Request, res: Response) => {
    const data = await this.service.listStudyRoomGoals(req.authUser!.id, req.params.roomId);
    return sendSuccess(res, listStudyRoomGoalsResponseSchema.parse(data));
  };

  createGoal = async (req: Request, res: Response) => {
    const data = await this.service.createStudyRoomGoal(req.authUser!.id, req.params.roomId, req.body);
    return sendSuccess(res, studyRoomGoalDtoSchema.parse(data), 201);
  };

  updateGoal = async (req: Request, res: Response) => {
    const data = await this.service.updateStudyRoomGoal(
      req.authUser!.id,
      req.params.roomId,
      req.params.goalId,
      req.body,
    );
    return sendSuccess(res, studyRoomGoalDtoSchema.parse(data));
  };

  deleteGoal = async (req: Request, res: Response) => {
    const data = await this.service.deleteStudyRoomGoal(
      req.authUser!.id,
      req.params.roomId,
      req.params.goalId,
    );
    return sendSuccess(res, data);
  };

  getTimer = async (req: Request, res: Response) => {
    const data = await this.service.getStudyRoomTimer(req.authUser!.id, req.params.roomId);
    return sendSuccess(res, studyRoomTimerDtoSchema.parse(data));
  };

  patchTimer = async (req: Request, res: Response) => {
    const data = await this.service.patchStudyRoomTimer(req.authUser!.id, req.params.roomId, req.body);
    return sendSuccess(res, studyRoomTimerDtoSchema.parse(data));
  };
}
