import type { Request, Response } from "express";
import { sendSuccess } from "../../core/http/response";
import {
  flashcardDtoSchema,
  listFlashcardsResponseSchema,
} from "./contracts";
import { FlashcardsService } from "./service";

export class FlashcardsController {
  constructor(private readonly service: FlashcardsService) {}

  listFlashcards = async (req: Request, res: Response) => {
    const data = await this.service.listFlashcards(req.authUser!.id, req.query as never);
    return sendSuccess(res, listFlashcardsResponseSchema.parse(data));
  };

  getFlashcardById = async (req: Request, res: Response) => {
    const { flashcardId } = req.params as { flashcardId: string };
    const data = await this.service.getFlashcardById(req.authUser!.id, flashcardId);
    return sendSuccess(res, flashcardDtoSchema.parse(data));
  };

  createFlashcard = async (req: Request, res: Response) => {
    const data = await this.service.createFlashcard(req.authUser!.id, req.body);
    return sendSuccess(res, flashcardDtoSchema.parse(data), 201);
  };

  updateFlashcard = async (req: Request, res: Response) => {
    const { flashcardId } = req.params as { flashcardId: string };
    const data = await this.service.updateFlashcard(
      req.authUser!.id,
      flashcardId,
      req.body,
    );
    return sendSuccess(res, flashcardDtoSchema.parse(data));
  };

  deleteFlashcard = async (req: Request, res: Response) => {
    const { flashcardId } = req.params as { flashcardId: string };
    const data = await this.service.deleteFlashcard(req.authUser!.id, flashcardId);
    return sendSuccess(res, data);
  };
}
