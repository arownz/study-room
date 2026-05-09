import { createAuthClient } from "better-auth/react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  fetchOptions: {
    credentials: "include",
  },
  sessionOptions: {
    refetchOnWindowFocus: true,
    refetchWhenOffline: false,
    refetchInterval: 0,
  },
});

type GetSessionResult = Awaited<ReturnType<typeof authClient.getSession>>;
export type ClientSession = GetSessionResult["data"];
