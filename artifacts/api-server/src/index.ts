import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { attachStudyRoomSocket } from "./realtime/study-room-socket";

const rawPort = String(env.PORT);

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  },
});

attachStudyRoomSocket(io);

httpServer.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
