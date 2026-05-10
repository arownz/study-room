import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/components/auth/require-auth";
import {
  AvatarUploader,
  RoleSelectionGrid,
  splitFullName,
  useProfile,
  useUpdateProfile,
  type UserRole,
} from "@/features/profile";

function OnboardingInner() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();

  const profile = profileQuery.data;
  const [role, setRole] = useState<UserRole | null>(null);

  // Pre-select the existing role so editing returning users feels stable.
  useEffect(() => {
    if (profile && role === null) {
      setRole((profile.role as UserRole) ?? "student");
    }
  }, [profile, role]);

  // If the user already finished onboarding (e.g. opens this URL by hand)
  // bounce straight back into the workspace.
  useEffect(() => {
    if (profile?.roleSelected) {
      navigate("/");
    }
  }, [profile?.roleSelected, navigate]);

  const handleContinue = async () => {
    if (!role) {
      toast({
        title: "Choose a role",
        description: "Pick the option that best describes how you'll use StudyRoom.",
      });
      return;
    }

    try {
      await updateProfile.mutateAsync({ role, roleSelected: true });
      toast({ title: "Welcome aboard", description: "Your workspace is ready." });
      navigate("/");
    } catch (error) {
      toast({
        title: "Could not save your role",
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  if (profileQuery.isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing your workspace...
        </div>
      </div>
    );
  }

  const firstName = splitFullName(profile.name).firstName || profile.name;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl border-border/60">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={14} />
            Welcome
          </div>
          <CardTitle className="text-2xl">
            Let's set up your workspace, {firstName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick how you'll use StudyRoom and (optionally) upload a profile
            photo. You can change either of these any time from settings.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <header>
              <p className="text-sm font-semibold">Your profile photo</p>
              <p className="text-xs text-muted-foreground">
                A photo helps collaborators recognise you in study rooms.
              </p>
            </header>
            <AvatarUploader name={profile.name} avatar={profile.avatar} size="lg" />
          </section>

          <Separator />

          <section className="space-y-3">
            <header>
              <p className="text-sm font-semibold">How will you use StudyRoom?</p>
              <p className="text-xs text-muted-foreground">
                Tailors the dashboard, AI prompts and recommendations.
              </p>
            </header>
            <RoleSelectionGrid
              value={role}
              onChange={setRole}
              disabled={updateProfile.isPending}
            />
          </section>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!role || updateProfile.isPending}
              data-testid="button-onboarding-continue"
              className="gap-1.5"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Continue to StudyRoom
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Onboarding() {
  return (
    <RequireAuth>
      <OnboardingInner />
    </RequireAuth>
  );
}
