import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { PomodoroController } from "./controller";
import {
  createPomodoroSessionBodySchema,
  listPomodoroSessionsQuerySchema,
} from "./contracts";
import { PomodoroRepository } from "./repository";
import { PomodoroService } from "./service";

const router: IRouter = Router();
const repository = new PomodoroRepository();
const service = new PomodoroService(repository);
const controller = new PomodoroController(service);

router.get(
  "/pomodoro/sessions",
  requireAuth,
  validateRequest({ query: listPomodoroSessionsQuerySchema }),
  asyncHandler(controller.listSessions),
);

router.post(
  "/pomodoro/sessions",
  requireAuth,
  validateRequest({ body: createPomodoroSessionBodySchema }),
  asyncHandler(controller.createSession),
);

export default router;
