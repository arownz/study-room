import type { ListUsersQuery, ListUsersResponse } from "./contracts";
import { UsersRepository } from "./repository";

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async listUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
    const items = await this.repository.listUsers(query);

    return {
      items: items.map((user) => ({
        ...user,
        avatar: user.avatar ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      page: {
        limit: query.limit,
        offset: query.offset,
      },
    };
  }
}
