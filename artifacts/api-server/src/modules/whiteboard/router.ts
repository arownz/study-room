import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { WhiteboardController } from "./controller";
import {
  createWhiteboardBodySchema,
  listWhiteboardsQuerySchema,
  updateWhiteboardBodySchema,
  whiteboardIdParamsSchema,
  whiteboardSnapshotBodySchema,
} from "./contracts";
import { WhiteboardRepository } from "./repository";
import { WhiteboardService } from "./service";

const router: IRouter = Router();
const repository = new WhiteboardRepository();
const service = new WhiteboardService(repository);
const controller = new WhiteboardController(service);

router.get(
  "/whiteboards",
  requireAuth,
  validateRequest({ query: listWhiteboardsQuerySchema }),
  asyncHandler(controller.list),
);
router.get(
  "/whiteboards/:whiteboardId",
  requireAuth,
  validateRequest({ params: whiteboardIdParamsSchema }),
  asyncHandler(controller.getById),
);
router.post(
  "/whiteboards",
  requireAuth,
  validateRequest({ body: createWhiteboardBodySchema }),
  asyncHandler(controller.create),
);
router.patch(
  "/whiteboards/:whiteboardId",
  requireAuth,
  validateRequest({ params: whiteboardIdParamsSchema, body: updateWhiteboardBodySchema }),
  asyncHandler(controller.update),
);
router.delete(
  "/whiteboards/:whiteboardId",
  requireAuth,
  validateRequest({ params: whiteboardIdParamsSchema }),
  asyncHandler(controller.remove),
);

router.get("/whiteboard", requireAuth, asyncHandler(controller.getMine));

router.put(
  "/whiteboard",
  requireAuth,
  validateRequest({ body: whiteboardSnapshotBodySchema }),
  asyncHandler(controller.putMine),
);

export default router;
