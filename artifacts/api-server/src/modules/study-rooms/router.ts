import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { StudyRoomsController } from "./controller";
import {
  createStudyRoomBodySchema,
  createStudyRoomGoalBodySchema,
  listStudyRoomsQuerySchema,
  patchStudyRoomTimerBodySchema,
  studyRoomGoalIdParamsSchema,
  studyRoomIdParamsSchema,
  updateStudyRoomBodySchema,
  updateStudyRoomGoalBodySchema,
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
  "/study-rooms/:roomId/goals",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema }),
  asyncHandler(controller.listGoals),
);
router.post(
  "/study-rooms/:roomId/goals",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema, body: createStudyRoomGoalBodySchema }),
  asyncHandler(controller.createGoal),
);
router.patch(
  "/study-rooms/:roomId/goals/:goalId",
  requireAuth,
  validateRequest({
    params: studyRoomGoalIdParamsSchema,
    body: updateStudyRoomGoalBodySchema,
  }),
  asyncHandler(controller.updateGoal),
);
router.delete(
  "/study-rooms/:roomId/goals/:goalId",
  requireAuth,
  validateRequest({ params: studyRoomGoalIdParamsSchema }),
  asyncHandler(controller.deleteGoal),
);
router.get(
  "/study-rooms/:roomId/timer",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema }),
  asyncHandler(controller.getTimer),
);
router.patch(
  "/study-rooms/:roomId/timer",
  requireAuth,
  validateRequest({ params: studyRoomIdParamsSchema, body: patchStudyRoomTimerBodySchema }),
  asyncHandler(controller.patchTimer),
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
