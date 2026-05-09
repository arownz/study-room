import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { paginationQuerySchema } from "../../core/http/contracts";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { CollaborationController } from "./controller";
import { CollaborationRepository } from "./repository";
import { CollaborationService } from "./service";

const router: IRouter = Router();
const repository = new CollaborationRepository();
const service = new CollaborationService(repository);
const controller = new CollaborationController(service);

router.get(
  "/collaboration/sessions",
  requireAuth,
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(controller.listSessions),
);

export default router;
