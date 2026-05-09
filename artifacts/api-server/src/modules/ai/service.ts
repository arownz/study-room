import type { PaginationQuery } from "../../core/http/contracts";
import { AiRepository } from "./repository";

export class AiService {
  constructor(private readonly repository: AiRepository) {}

  async listAiJobs(query: PaginationQuery) {
    return {
      items: await this.repository.listAiJobs(query),
    };
  }
}
