import type { Server } from "socket.io";

let socketIo: Server | null = null;

export function setSocketIo(server: Server): void {
  socketIo = server;
}

export function getSocketIo(): Server | null {
  return socketIo;
}
