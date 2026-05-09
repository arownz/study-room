import type { PaginationQuery } from "../../core/http/contracts";

export class CollaborationRepository {
  async listSessions(_query: PaginationQuery) {
    return [] as Array<{ id: string; roomId: string; participants: number }>;
  }
}
