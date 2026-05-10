/// <reference types="node" />
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit does not load `.env` itself. Read the monorepo-root `.env`
 * so `pnpm --filter @workspace/db migrate` works without manually
 * `source`-ing the file (Git Bash / zsh).
 */
function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

const configDir = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(configDir, "../../.env"));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL missing. Add it to the repo-root .env or export it in your shell.",
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
