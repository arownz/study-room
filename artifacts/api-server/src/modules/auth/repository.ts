import type { AuthSession, AuthUser } from "./types";

export interface AuthMePayload {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    emailVerified: boolean;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

export class AuthRepository {
  mapAuthMePayload(user: AuthUser, session: AuthSession): AuthMePayload {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar:
          (user as { avatar?: string | null; image?: string | null }).avatar ??
          (user as { avatar?: string | null; image?: string | null }).image ??
          null,
        role: (user as { role?: string }).role ?? "student",
        emailVerified: user.emailVerified,
      },
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      },
    };
  }
}
