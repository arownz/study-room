import type { Request } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";

export async function getRequestSession(request: Request) {
  return auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
}
