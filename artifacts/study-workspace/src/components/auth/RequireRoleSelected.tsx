import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/features/profile";

interface RequireRoleSelectedProps {
  children: React.ReactNode;
}

/**
 * Forces newly-registered users (email or social) through the onboarding
 * screen until they explicitly choose a role. This guard sits below
 * RequireAuth so we know a session exists.
 */
export function RequireRoleSelected({ children }: RequireRoleSelectedProps) {
  const profileQuery = useProfile();
  const [, navigate] = useLocation();

  const profile = profileQuery.data;
  const needsOnboarding =
    profileQuery.isSuccess && profile && profile.roleSelected === false;

  useEffect(() => {
    if (needsOnboarding) {
      navigate("/onboarding");
    }
  }, [needsOnboarding, navigate]);

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return null;
  }

  return <>{children}</>;
}
