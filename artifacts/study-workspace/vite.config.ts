import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const monorepoRoot = path.resolve(import.meta.dirname, "../..");
const DEFAULT_FRONTEND_PORT = 21654;
const DEFAULT_API_PORT = 5000;
const replitPlugins =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
    ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({
            root: path.resolve(import.meta.dirname, ".."),
          }),
        ),
      ]
    : [];

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid port value: "${raw}"`);
  }
  return parsed;
}

function tryGetPortFromUrl(raw: string | undefined): number | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.port) return parsePort(url.port, DEFAULT_FRONTEND_PORT);
    if (url.protocol === "https:") return 443;
    if (url.protocol === "http:") return 80;
  } catch {
    return null;
  }
  return null;
}

function normalizeBasePath(raw: string | undefined): string {
  if (!raw || raw.trim() === "") return "/";
  let base = raw.trim().replace(/\\/g, "/");
  if (!base.startsWith("/")) base = `/${base}`;
  if (base !== "/" && base.endsWith("/")) base = base.replace(/\/+$/, "");
  return base;
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, monorepoRoot, "");
  const isDevServer = command === "serve";
  const frontendPort = parsePort(
    env.VITE_DEV_PORT ??
      env.VITE_FRONTEND_PORT ??
      (tryGetPortFromUrl(env.FRONTEND_ORIGIN)?.toString() ?? undefined),
    DEFAULT_FRONTEND_PORT,
  );
  const basePath = isDevServer ? "/" : normalizeBasePath(env.VITE_BASE_PATH);
  const apiPort =
    tryGetPortFromUrl(
      env.VITE_API_BASE_URL ?? env.API_ORIGIN ?? env.BETTER_AUTH_URL,
    ) ??
    parsePort(env.API_PORT, DEFAULT_API_PORT);

  return {
    // Keep dev rooted at "/" so shell/base-path leakage cannot corrupt Vite URLs.
    base: basePath,
    envDir: monorepoRoot,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: frontendPort,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: {
        "/socket.io": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: frontendPort,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
