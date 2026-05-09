import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { UsersController } from "./controller";
import { listUsersQuerySchema } from "./contracts";
import { UsersRepository } from "./repository";
import { UsersService } from "./service";

const router: IRouter = Router();
const repository = new UsersRepository();
const service = new UsersService(repository);
const controller = new UsersController(service);

router.get(
  "/users",
  requireAuth,
  validateRequest({ query: listUsersQuerySchema }),
  asyncHandler(controller.listUsers),
);

export default router;
