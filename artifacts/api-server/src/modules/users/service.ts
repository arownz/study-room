import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/app-error";
import { env } from "../../config/env";
import {
  dashboardSummarySchema,
  parseStoredNotificationPreferences,
  type DashboardSummary,
  type ListUsersQuery,
  type ListUsersResponse,
  type MeDto,
  type UpdateMeRequest,
} from "./contracts";
import { UsersRepository } from "./repository";

type DbUser = NonNullable<Awaited<ReturnType<UsersRepository["getUserById"]>>>;

function resolveAvatarPublicUrl(user: {
  id: string;
  avatar: string | null;
  avatarData: Buffer | null;
  updatedAt: Date;
}): string | null {
  if (user.avatarData && user.avatarData.length > 0) {
    const base = env.API_ORIGIN.replace(/\/$/, "");
    return `${base}/api/v1/users/${user.id}/avatar?v=${user.updatedAt.getTime()}`;
  }
  return user.avatar ?? null;
}

function serializeUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: resolveAvatarPublicUrl(user),
    role: user.role,
    roleSelected: user.roleSelected,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export type UserAvatarStreamResult =
  | { kind: "bytes"; mimeType: string; data: Buffer }
  | { kind: "redirect"; url: string }
  | { kind: "not_found" };

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async listUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
    const items = await this.repository.listUsers(query);

    return {
      items: items.map(serializeUser),
      page: {
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

  async getMe(userId: string): Promise<MeDto> {
    const [user, accounts] = await Promise.all([
      this.repository.getUserById(userId),
      this.repository.listAccountsForUser(userId),
    ]);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return {
      ...serializeUser(user),
      accounts: accounts.map((account) => ({
        providerId: account.providerId,
        accountId: account.accountId,
        scope: account.scope ?? null,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      })),
      notificationPreferences: parseStoredNotificationPreferences(user.notificationPreferences),
    };
  }

  async updateMe(userId: string, patch: UpdateMeRequest): Promise<MeDto> {
    let effectivePatch: UpdateMeRequest = patch;
    if (patch.notificationPreferences !== undefined) {
      const existing = await this.repository.getUserById(userId);
      if (!existing) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }
      const current = parseStoredNotificationPreferences(existing.notificationPreferences);
      effectivePatch = {
        ...patch,
        notificationPreferences: { ...current, ...patch.notificationPreferences },
      };
    }

    const updated = await this.repository.updateUser(userId, effectivePatch);
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return this.getMe(userId);
  }

  async uploadAvatarFromBuffer(userId: string, buffer: Buffer, mimeType: string): Promise<MeDto> {
    const existing = await this.repository.getUserById(userId);
    if (!existing) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    const base = env.API_ORIGIN.replace(/\/$/, "");
    const publicUrl = `${base}/api/v1/users/${userId}/avatar`;
    const updated = await this.repository.setAvatarInline(userId, {
      data: buffer,
      mimeType,
      publicUrl,
    });
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return this.getMe(userId);
  }

  async deleteAvatar(userId: string): Promise<MeDto> {
    const updated = await this.repository.clearAvatar(userId);
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return this.getMe(userId);
  }

  async resolveAvatarStream(userId: string): Promise<UserAvatarStreamResult> {
    const row = await this.repository.getAvatarPayload(userId);
    if (!row) {
      return { kind: "not_found" };
    }
    if (row.avatarData && row.avatarData.length > 0 && row.avatarMime) {
      return { kind: "bytes", mimeType: row.avatarMime, data: row.avatarData };
    }
    if (row.avatar && /^https?:\/\//i.test(row.avatar)) {
      return { kind: "redirect", url: row.avatar };
    }
    return { kind: "not_found" };
  }

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const raw = await this.repository.getDashboardSummary(userId);
    return dashboardSummarySchema.parse(raw);
  }

  async createNoteImageFromBuffer(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
    const id = randomUUID();
    await this.repository.insertNoteImageAsset({
      id,
      userId,
      mimeType,
      data: buffer,
    });
    return id;
  }

  async getNoteImageBytesForOwner(
    assetId: string,
    userId: string,
  ): Promise<{ mimeType: string; data: Buffer } | null> {
    return this.repository.getNoteImageAssetOwned(assetId, userId);
  }
}
