import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@workspace/db";
import { accounts, sessions, users, verificationTokens } from "@workspace/db/schema";
import { env, isProduction } from "../../config/env";

const apiOrigin = new URL(env.API_ORIGIN);
const frontendOrigin = new URL(env.FRONTEND_ORIGIN);
const isCrossSiteDeployment =
  apiOrigin.protocol !== frontendOrigin.protocol ||
  apiOrigin.hostname !== frontendOrigin.hostname;

export const auth = betterAuth({
  baseURL: env.API_ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_ORIGIN, env.API_ORIGIN],
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
      // Forces onboarding role selection on the SPA. Better Auth does not
      // touch this column itself; the /users/me PATCH endpoint flips it
      // to true once the user picks a role.
      roleSelected: {
        type: "boolean",
        required: false,
        defaultValue: false,
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
      // Google profile.picture is already a fully-qualified CDN URL,
      // but we normalize the mapping to keep behaviour explicit and
      // mirror the Discord branch below.
      mapProfileToUser: (profile) => ({
        image:
          (profile as { picture?: string | null; image?: string | null })
            .picture ??
          (profile as { picture?: string | null; image?: string | null })
            .image ??
          undefined,
      }),
    },
    discord: {
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      // Discord returns only the avatar hash on the OAuth profile. We
      // expand it into a full CDN URL here so the user.avatar column
      // ends up with a usable image source instead of a bare hash.
      mapProfileToUser: (profile) => {
        const discord = profile as {
          id?: string;
          avatar?: string | null;
          discriminator?: string | null;
        };

        if (discord.id && discord.avatar) {
          const ext = discord.avatar.startsWith("a_") ? "gif" : "png";
          return {
            image: `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.${ext}?size=256`,
          };
        }

        if (discord.id && discord.discriminator) {
          // Legacy default avatar fallback.
          const idx = Number.parseInt(discord.discriminator, 10) % 5;
          return {
            image: `https://cdn.discordapp.com/embed/avatars/${idx}.png`,
          };
        }

        return { image: undefined };
      },
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
      sameSite: isProduction && isCrossSiteDeployment ? "none" : "lax",
      secure: isProduction,
      path: "/",
    },
  },
});
