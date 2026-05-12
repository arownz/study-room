import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { WhiteboardController } from "./controller";
import { whiteboardSnapshotBodySchema } from "./contracts";
import { WhiteboardRepository } from "./repository";
import { WhiteboardService } from "./service";

const router: IRouter = Router();
const repository = new WhiteboardRepository();
const service = new WhiteboardService(repository);
const controller = new WhiteboardController(service);

router.get("/whiteboard", requireAuth, asyncHandler(controller.getMine));

router.put(
  "/whiteboard",
  requireAuth,
  validateRequest({ body: whiteboardSnapshotBodySchema }),
  asyncHandler(controller.putMine),
);

export default router;
