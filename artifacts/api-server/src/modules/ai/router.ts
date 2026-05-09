import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { paginationQuerySchema } from "../../core/http/contracts";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { AiController } from "./controller";
import { AiRepository } from "./repository";
import { AiService } from "./service";

const router: IRouter = Router();
const repository = new AiRepository();
const service = new AiService(repository);
const controller = new AiController(service);

router.get(
  "/ai/jobs",
  requireAuth,
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(controller.listAiJobs),
);

export default router;
