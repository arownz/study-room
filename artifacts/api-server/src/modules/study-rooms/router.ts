import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { StudyRoomsController } from "./controller";
import {
  createStudyRoomBodySchema,
  listStudyRoomsQuerySchema,
  studyRoomIdParamsSchema,
  updateStudyRoomBodySchema,
} from "./contracts";
import { StudyRoomsRepository } from "./repository";
import { StudyRoomsService } from "./service";

const router: IRouter = Router();
const repository = new StudyRoomsRepository();
const service = new StudyRoomsService(repository);
const controller = new StudyRoomsController(service);

router.get(
  "/study-rooms",
  requireAuth,
  validateRequest({ query: listStudyRoomsQuerySchema }),
  asyncHandler(controller.listStudyRooms),
);
router.get(
  "/study-rooms/:roomId",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema }),
  asyncHandler(controller.getStudyRoomById),
);
router.post(
  "/study-rooms",
  requireAuth,
  validateRequest({ body: createStudyRoomBodySchema }),
  asyncHandler(controller.createStudyRoom),
);
router.patch(
  "/study-rooms/:roomId",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema, body: updateStudyRoomBodySchema }),
  asyncHandler(controller.updateStudyRoom),
);
router.delete(
  "/study-rooms/:roomId",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema }),
  asyncHandler(controller.deleteStudyRoom),
);

export default router;
