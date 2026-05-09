import type { auth } from "./auth";

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthUser = AuthSession["user"];

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthSession["session"];
      authUser?: AuthUser;
    }
  }
}

export {};
