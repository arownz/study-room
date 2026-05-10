import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@workspace/db";
import { accounts, sessions, users, verificationTokens } from "@workspace/db/schema";
import { env, isProduction } from "../../config/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_ORIGIN, env.BETTER_AUTH_URL],
  // Map Better Auth's internal model names to our Drizzle tables.
  // Keys here MUST match the model names Better Auth uses internally
  // (default: user, session, account, verification). Do not override
  // entity `modelName` below — it changes the lookup key and breaks
  // social sign-in which needs the verification model.
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verificationTokens,
    },
  }),
  user: {
    fields: {
      image: "avatar",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    deferSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: "jwe",
    },
  },
  rateLimit: {
    enabled: true,
    storage: "memory",
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 10,
      },
      "/sign-up/email": {
        window: 60,
        max: 10,
      },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
    },
  },
});
