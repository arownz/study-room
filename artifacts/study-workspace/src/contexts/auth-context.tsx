import { createContext, useContext, useMemo } from "react";
import { authClient, type ClientSession } from "@/lib/auth/auth-client";

interface AuthContextValue {
  session: ClientSession | null;
  isLoading: boolean;
  errorMessage: string | null;
  refetchSession: () => Promise<unknown>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const sessionQuery = authClient.useSession();

  const value = useMemo<AuthContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isLoading: sessionQuery.isPending,
      errorMessage: sessionQuery.error?.message ?? null,
      refetchSession: sessionQuery.refetch,
      signOut: async () => {
        await authClient.signOut();
        await sessionQuery.refetch();
      },
    }),
    [sessionQuery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
