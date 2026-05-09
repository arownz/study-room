import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import { listStudyRoomsResponseSchema, studyRoomDtoSchema } from "./contracts";
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
}
