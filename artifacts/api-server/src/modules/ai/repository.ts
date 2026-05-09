import type { PaginationQuery } from "../../core/http/contracts";

export class AiRepository {
  async listAiJobs(_query: PaginationQuery) {
    return [] as Array<{ id: string; type: string; status: string }>;
  }
}
