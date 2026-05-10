import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import {
  joinName,
  splitFullName,
  useProfile,
  useUpdateProfile,
  type ProfileUser,
} from "@/features/profile";

interface ProfileFormState {
  firstName: string;
  lastName: string;
  avatar: string;
}

function buildInitialState(user: ProfileUser | undefined): ProfileFormState {
  if (!user) return { firstName: "", lastName: "", avatar: "" };
  const { firstName, lastName } = splitFullName(user.name);
  return {
    firstName,
    lastName,
    avatar: user.avatar ?? "",
  };
}

export function ProfileSettingsCard() {
  const { toast } = useToast();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const user = profileQuery.data;

  const [form, setForm] = useState<ProfileFormState>(() => buildInitialState(user));

  useEffect(() => {
    setForm(buildInitialState(user));
  }, [user]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    const initial = buildInitialState(user);
    return (
      initial.firstName !== form.firstName ||
      initial.lastName !== form.lastName ||
      initial.avatar !== form.avatar
    );
  }, [form, user]);

  const isLoading = profileQuery.isLoading;
  const isError = profileQuery.isError;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const trimmedName = joinName(form.firstName, form.lastName);
    if (trimmedName.length === 0) {
      toast({
        title: "Name required",
        description: "Enter a first name (and optional last name).",
      });
      return;
    }

    const trimmedAvatar = form.avatar.trim();
    const nextAvatar = trimmedAvatar.length === 0 ? null : trimmedAvatar;

    try {
      await updateProfile.mutateAsync({
        name: trimmedName,
        avatar: nextAvatar,
      });
      toast({
        title: "Profile updated",
        description: "Your changes were saved.",
      });
    } catch (error) {
      toast({
        title: "Could not save profile",
        description:
          error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <ProfileSettingsSkeleton />
        ) : isError || !user ? (
          <p className="text-sm text-destructive">
            Could not load profile. Try refreshing the page.
          </p>
        ) : (
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="flex items-center gap-4">
              <UserAvatar
                src={user.avatar}
                name={user.name}
                className="h-16 w-16"
                fallbackClassName="bg-primary/20 text-primary text-xl"
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Avatar URL</Label>
                <Input
                  value={form.avatar}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, avatar: event.target.value }))
                  }
                  placeholder="https://..."
                  data-testid="input-avatar-url"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a public image URL. Leave blank to use the default
                  avatar.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  value={user.email}
                  type="email"
                  readOnly
                  disabled
                  data-testid="input-email"
                />
                <p className="text-xs text-muted-foreground">
                  {user.emailVerified ? "Verified" : "Unverified"} ·{" "}
                  Email is managed by your sign-in provider.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Input value={user.role} readOnly disabled />
              </div>
            </div>

            <Button
              type="submit"
              className="gap-1.5"
              disabled={!isDirty || updateProfile.isPending}
              data-testid="button-save-profile"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileSettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-32" />
    </div>
  );
}
