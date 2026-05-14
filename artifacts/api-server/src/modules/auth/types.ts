import type { auth } from "./auth";

type AuthSessionResult = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthSession = AuthSessionResult["session"];
export type AuthUser = AuthSessionResult["user"];

declare global {
  namespace Express {
    interface Request {
      authSession?: AuthSession;
      authUser?: AuthUser;
    }
  }
}

export {};
