import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { attachStudyRoomSocket } from "./realtime/study-room-socket";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  },
});

attachStudyRoomSocket(io);

httpServer.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

httpServer.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT, origin: env.API_ORIGIN }, "Server listening");
});
