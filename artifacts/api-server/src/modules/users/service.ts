import { AppError } from "../../lib/app-error";
import {
  dashboardSummarySchema,
  type DashboardSummary,
  type ListUsersQuery,
  type ListUsersResponse,
  type MeDto,
  type UpdateMeRequest,
} from "./contracts";
import { UsersRepository } from "./repository";

type DbUser = NonNullable<Awaited<ReturnType<UsersRepository["getUserById"]>>>;

function serializeUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    role: user.role,
    roleSelected: user.roleSelected,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

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
    };
  }

  async updateMe(userId: string, patch: UpdateMeRequest): Promise<MeDto> {
    const updated = await this.repository.updateUser(userId, patch);
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return this.getMe(userId);
  }

  async setAvatar(userId: string, avatar: string | null): Promise<MeDto> {
    const updated = await this.repository.setAvatar(userId, avatar);
    if (!updated) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return this.getMe(userId);
  }

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const raw = await this.repository.getDashboardSummary(userId);
    return dashboardSummarySchema.parse(raw);
  }
}
