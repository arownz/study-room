import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { FlashcardsController } from "./controller";
import {
  createFlashcardBodySchema,
  flashcardIdParamsSchema,
  listFlashcardsQuerySchema,
  updateFlashcardBodySchema,
} from "./contracts";
import { FlashcardsRepository } from "./repository";
import { FlashcardsService } from "./service";

const router: IRouter = Router();
const repository = new FlashcardsRepository();
const service = new FlashcardsService(repository);
const controller = new FlashcardsController(service);

router.get(
  "/flashcards",
  requireAuth,
  validateRequest({ query: listFlashcardsQuerySchema }),
  asyncHandler(controller.listFlashcards),
);
router.get(
  "/flashcards/:flashcardId",
  requireAuth,
  validateRequest({ params: flashcardIdParamsSchema }),
  asyncHandler(controller.getFlashcardById),
);
router.post(
  "/flashcards",
  requireAuth,
  validateRequest({ body: createFlashcardBodySchema }),
  asyncHandler(controller.createFlashcard),
);
router.patch(
  "/flashcards/:flashcardId",
  requireAuth,
  validateRequest({ params: flashcardIdParamsSchema, body: updateFlashcardBodySchema }),
  asyncHandler(controller.updateFlashcard),
);
router.delete(
  "/flashcards/:flashcardId",
  requireAuth,
  validateRequest({ params: flashcardIdParamsSchema }),
  asyncHandler(controller.deleteFlashcard),
);

export default router;
