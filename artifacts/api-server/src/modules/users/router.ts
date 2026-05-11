import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { UsersController } from "./controller";
import {
  listUsersQuerySchema,
  updateMeRequestSchema,
} from "./contracts";
import { UsersRepository } from "./repository";
import { UsersService } from "./service";
import { avatarUpload } from "./avatar-storage";
import { noteImageUpload } from "./note-image-upload";

const router: IRouter = Router();
const repository = new UsersRepository();
const service = new UsersService(repository);
const controller = new UsersController(service);

// `/users/me*` routes are registered before the generic list route so
// the static segment "me" is never captured as an :id parameter.
router.get("/users/me", requireAuth, asyncHandler(controller.getMe));
router.get(
  "/users/me/dashboard-summary",
  requireAuth,
  asyncHandler(controller.getDashboardSummary),
);
router.patch(
  "/users/me",
  requireAuth,
  validateRequest({ body: updateMeRequestSchema }),
  asyncHandler(controller.updateMe),
);

router.post(
  "/users/me/avatar",
  requireAuth,
  avatarUpload.single("file"),
  asyncHandler(controller.uploadAvatar),
);

router.delete(
  "/users/me/avatar",
  requireAuth,
  asyncHandler(controller.deleteAvatar),
);

router.post(
  "/note-images",
  requireAuth,
  noteImageUpload.single("file"),
  asyncHandler(controller.uploadNoteImage),
);

router.get(
  "/users",
  requireAuth,
  validateRequest({ query: listUsersQuerySchema }),
  asyncHandler(controller.listUsers),
);

export default router;
