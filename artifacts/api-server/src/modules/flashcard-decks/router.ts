import { Router, type IRouter } from "express";
import { asyncHandler } from "../../core/http/async-handler";
import { validateRequest } from "../../core/http/validate";
import { requireAuth } from "../auth/middleware";
import { FlashcardDecksController } from "./controller";
import {
  createFlashcardDeckBodySchema,
  flashcardDeckIdParamsSchema,
  listFlashcardDecksQuerySchema,
  updateFlashcardDeckBodySchema,
} from "./contracts";
import { FlashcardDecksRepository } from "./repository";
import { FlashcardDecksService } from "./service";

const router: IRouter = Router();
const repository = new FlashcardDecksRepository();
const service = new FlashcardDecksService(repository);
const controller = new FlashcardDecksController(service);

router.get(
  "/flashcard-decks",
  requireAuth,
  validateRequest({ query: listFlashcardDecksQuerySchema }),
  asyncHandler(controller.listDecks),
);
router.get(
  "/flashcard-decks/:deckId/stats",
  requireAuth,
  validateRequest({ params: flashcardDeckIdParamsSchema }),
  asyncHandler(controller.deckStats),
);
router.get(
  "/flashcard-decks/:deckId",
  requireAuth,
  validateRequest({ params: flashcardDeckIdParamsSchema }),
  asyncHandler(controller.getDeckById),
);
router.post(
  "/flashcard-decks",
  requireAuth,
  validateRequest({ body: createFlashcardDeckBodySchema }),
  asyncHandler(controller.createDeck),
);
router.patch(
  "/flashcard-decks/:deckId",
  requireAuth,
  validateRequest({ params: flashcardDeckIdParamsSchema, body: updateFlashcardDeckBodySchema }),
  asyncHandler(controller.updateDeck),
);
router.delete(
  "/flashcard-decks/:deckId",
  requireAuth,
  validateRequest({ params: flashcardDeckIdParamsSchema }),
  asyncHandler(controller.deleteDeck),
);

export default router;
