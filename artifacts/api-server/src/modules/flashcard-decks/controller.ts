import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import {
  flashcardDeckDtoSchema,
  flashcardDeckStatsSchema,
  listFlashcardDecksResponseSchema,
} from "./contracts";
import { FlashcardDecksService } from "./service";

export class FlashcardDecksController {
  constructor(private readonly service: FlashcardDecksService) {}

  listDecks = async (req: Request, res: Response) => {
    const data = await this.service.listDecks(req.authUser!.id, req.query as never);
    return sendSuccess(res, listFlashcardDecksResponseSchema.parse(data));
  };

  getDeckById = async (req: Request, res: Response) => {
    const { deckId } = req.params as { deckId: string };
    const data = await this.service.getDeckById(req.authUser!.id, deckId);
    return sendSuccess(res, flashcardDeckDtoSchema.parse(data));
  };

  createDeck = async (req: Request, res: Response) => {
    const data = await this.service.createDeck(req.authUser!.id, req.body);
    return sendSuccess(res, flashcardDeckDtoSchema.parse(data), 201);
  };

  updateDeck = async (req: Request, res: Response) => {
    const { deckId } = req.params as { deckId: string };
    const data = await this.service.updateDeck(req.authUser!.id, deckId, req.body);
    return sendSuccess(res, flashcardDeckDtoSchema.parse(data));
  };

  deleteDeck = async (req: Request, res: Response) => {
    const { deckId } = req.params as { deckId: string };
    const data = await this.service.deleteDeck(req.authUser!.id, deckId);
    return sendSuccess(res, data);
  };

  deckStats = async (req: Request, res: Response) => {
    const { deckId } = req.params as { deckId: string };
    const data = await this.service.deckStats(req.authUser!.id, deckId);
    return sendSuccess(res, flashcardDeckStatsSchema.parse(data));
  };
}
