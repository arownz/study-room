import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { paginationQuerySchema } from "../../core/http/contracts";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { AiController } from "./controller";
import {
  appendAiMessageBodySchema,
  createAiThreadBodySchema,
  listAiThreadsQuerySchema,
  threadIdParamsSchema,
} from "./contracts";
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

router.get(
  "/ai/threads/:threadId/messages",
  requireAuth,
  validateRequest({ params: threadIdParamsSchema }),
  asyncHandler(controller.listMessages),
);

router.post(
  "/ai/threads/:threadId/messages",
  requireAuth,
  validateRequest({ params: threadIdParamsSchema, body: appendAiMessageBodySchema }),
  asyncHandler(controller.appendMessage),
);

router.get(
  "/ai/threads",
  requireAuth,
  validateRequest({ query: listAiThreadsQuerySchema }),
  asyncHandler(controller.listThreads),
);

router.post(
  "/ai/threads",
  requireAuth,
  validateRequest({ body: createAiThreadBodySchema }),
  asyncHandler(controller.createThread),
);

export default router;
