import { and, desc, eq } from "drizzle-orm";
import { accounts, users } from "@workspace/db/schema";
import { db } from "../../lib/database";
import type { ListUsersQuery, UpdateMeRequest } from "./contracts";

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  avatar: users.avatar,
  role: users.role,
  roleSelected: users.roleSelected,
  emailVerified: users.emailVerified,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

export class UsersRepository {
  async listUsers(query: ListUsersQuery) {
    const rows = await db
      .select(userColumns)
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return rows;
  }

  async getUserById(id: string) {
    const [row] = await db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ?? null;
  }

  async listAccountsForUser(userId: string) {
    const rows = await db
      .select({
        providerId: accounts.providerId,
        accountId: accounts.accountId,
        scope: accounts.scope,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));
    return rows;
  }

  async updateUser(id: string, patch: UpdateMeRequest) {
    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.avatar !== undefined) updates.avatar = patch.avatar;
    if (patch.role !== undefined) updates.role = patch.role;
    if (patch.roleSelected !== undefined) updates.roleSelected = patch.roleSelected;

    if (Object.keys(updates).length === 0) {
      return this.getUserById(id);
    }

    updates.updatedAt = new Date();

    const [row] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning(userColumns);
    return row ?? null;
  }

  async setAvatar(id: string, avatar: string | null) {
    const [row] = await db
      .update(users)
      .set({ avatar, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(userColumns);
    return row ?? null;
  }

  async unlinkAccount(userId: string, providerId: string) {
    await db
      .delete(accounts)
      .where(
        and(eq(accounts.userId, userId), eq(accounts.providerId, providerId)),
      );
  }
}
