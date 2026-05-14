import { Router, type IRouter } from "express";
import { z } from "zod";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { StudyAnalyticsController } from "../study-analytics/controller";
import { StudyAnalyticsRepository } from "../study-analytics/repository";
import { StudyAnalyticsService } from "../study-analytics/service";
import { studyAnalyticsQuerySchema } from "../study-analytics/contracts";
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

const studyAnalyticsRepository = new StudyAnalyticsRepository();
const studyAnalyticsService = new StudyAnalyticsService(studyAnalyticsRepository);
const studyAnalyticsController = new StudyAnalyticsController(studyAnalyticsService);

// `/users/me*` routes are registered before the generic list route so
// the static segment "me" is never captured as an :id parameter.
router.get("/users/me", requireAuth, asyncHandler(controller.getMe));
router.get(
  "/users/me/dashboard-summary",
  requireAuth,
  asyncHandler(controller.getDashboardSummary),
);
router.get(
  "/users/me/study-analytics",
  requireAuth,
  validateRequest({ query: studyAnalyticsQuerySchema }),
  asyncHandler(studyAnalyticsController.getMine),
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

const userAvatarParamsSchema = z.object({
  userId: z.string().min(1).max(191),
});

router.get(
  "/users/:userId/avatar",
  requireAuth,
  validateRequest({ params: userAvatarParamsSchema }),
  asyncHandler(controller.getUserAvatar),
);

const noteImageAssetParamsSchema = z.object({
  assetId: z.string().uuid(),
});

router.get(
  "/note-images/:assetId",
  requireAuth,
  validateRequest({ params: noteImageAssetParamsSchema }),
  asyncHandler(controller.getNoteImage),
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
