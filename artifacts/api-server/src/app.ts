import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { toNodeHandler } from "better-auth/node";
import "./modules/auth/types";
import router from "./routes";
import { auth } from "./modules/auth/auth";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";

const app: Express = express();

const uploadsDir = path.resolve(process.cwd(), "uploads");
mkdirSync(path.join(uploadsDir, "avatars"), { recursive: true });

app.use(requestLogger);
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

// Silence Chrome DevTools' automatic well-known probe so it stops
// polluting browser console + CSP logs after OAuth redirects.
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => {
  res.status(204).end();
});

// API root: when the user lands on the bare API origin (e.g. after a
// social-login callback that resolved a relative `callbackURL: "/"`)
// bounce them back to the SPA so they don't see "Cannot GET /".
app.get("/", (_req, res) => {
  res.redirect(302, env.FRONTEND_ORIGIN);
});

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User-uploaded assets (avatars). Served from the API origin so cookies
// aren't required and so URLs can be consumed from <img src=...>.
app.use(
  "/uploads",
  express.static(uploadsDir, {
    fallthrough: false,
    maxAge: "1h",
  }),
);

app.use("/api", router);
app.use(errorHandler);

export default app;
