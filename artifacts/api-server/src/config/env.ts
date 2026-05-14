import { z } from "zod";

const DEFAULT_API_PORT = 5000;

function inferLocalApiOrigin(rawPort: string | undefined): string | undefined {
  if (!rawPort) return undefined;
  const parsed = Number(rawPort);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return `http://localhost:${parsed}`;
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(DEFAULT_API_PORT),
  API_ORIGIN: z.string().url("API_ORIGIN must be valid URL"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 chars"),
  FRONTEND_ORIGIN: z.string().url("FRONTEND_ORIGIN must be valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  DISCORD_CLIENT_SECRET: z.string().min(1, "DISCORD_CLIENT_SECRET is required"),
});

// Prefer API_* names so unrelated shell PORT exports cannot hijack the server.
const normalizedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  API_PORT: process.env.API_PORT ?? process.env.PORT,
  API_ORIGIN:
    process.env.API_ORIGIN ??
    process.env.BETTER_AUTH_URL ??
    inferLocalApiOrigin(process.env.API_PORT ?? process.env.PORT),
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
};

const parsed = EnvSchema.safeParse(normalizedEnv);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${parsed.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")}`,
  );
}

export const env = {
  ...parsed.data,
  BETTER_AUTH_URL: parsed.data.API_ORIGIN,
} as const;

export const isProduction = env.NODE_ENV === "production";
