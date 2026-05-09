import { desc } from "drizzle-orm";
import { users } from "@workspace/db/schema";
import { db } from "../../lib/database";
import type { ListUsersQuery } from "./contracts";

export class UsersRepository {
  async listUsers(query: ListUsersQuery) {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return rows;
  }
}
