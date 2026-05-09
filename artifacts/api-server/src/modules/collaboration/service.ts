import type { PaginationQuery } from "../../core/http/contracts";
import { CollaborationRepository } from "./repository";

export class CollaborationService {
  constructor(private readonly repository: CollaborationRepository) {}

  async listSessions(query: PaginationQuery) {
    return {
      items: await this.repository.listSessions(query),
    };
  }
}
