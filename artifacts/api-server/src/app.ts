import express, { type Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import "./modules/auth/types";
import router from "./routes";
import { auth } from "./modules/auth/auth";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";

const app: Express = express();

app.use(requestLogger);
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use(errorHandler);

export default app;
