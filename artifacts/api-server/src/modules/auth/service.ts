import type { AuthSession, AuthUser } from "./types";
import { AuthRepository } from "./repository";

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  getAuthMe(user: AuthUser, session: AuthSession) {
    return this.repository.mapAuthMePayload(user, session);
  }
}
