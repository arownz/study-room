import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { authClient } from "@/lib/auth/auth-client";
import { signUpSchema, type SignUpInput } from "@/lib/auth/validation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useUploadAvatar } from "@/features/profile";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";

const defaultValues: SignUpInput = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const AVATAR_ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function Signup() {
  const [form, setForm] = useState<SignUpInput>(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { session, isLoading } = useAuth();
  const uploadAvatar = useUploadAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarPreviewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!isLoading && session) {
      // Authenticated visitors landing on the signup screen always go
      // through the role guard so onboarding is honoured.
      navigate("/");
    }
  }, [isLoading, session, navigate]);

  const handleAvatarPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    if (!AVATAR_ACCEPT.includes(file.type)) {
      toast({
        title: "Unsupported file",
        description: "Use a PNG, JPG, WEBP or GIF image.",
      });
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast({
        title: "Image too large",
        description: "Maximum upload size is 10 MB.",
      });
      return;
    }

    setAvatarFile(file);
  };

  const submitEmailSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message ?? "Check form values",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: `${window.location.origin}/onboarding`,
    });

    if (error) {
      setSubmitting(false);
      toast({
        title: "Sign up failed",
        description: error.message,
      });
      return;
    }

    if (avatarFile) {
      try {
        await uploadAvatar.mutateAsync(avatarFile);
      } catch (uploadError) {
        toast({
          title: "Avatar upload failed",
          description:
            uploadError instanceof Error
              ? `${uploadError.message} Your account was created successfully.`
              : "Your account was created, but the avatar could not be uploaded.",
        });
      }
    }

    setSubmitting(false);

    // Brand new account → role-selection screen.
    // The RoleGuard will keep returning users that already chose a role
    // out of /onboarding automatically.
    navigate("/onboarding");
  };

  const socialSignIn = async (provider: "google" | "discord") => {
    // Better Auth resolves `callbackURL` against its own `baseURL` (the API
    // origin). Pass an absolute frontend URL so OAuth lands the user back
    // in the SPA instead of "Cannot GET /" on the API host.
    await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl">Create StudyRoom account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={submitEmailSignup}>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
              <UserAvatar
                src={avatarPreviewUrl}
                name={form.name || form.email || "User"}
                className="h-20 w-20"
                fallbackClassName="bg-primary/15 text-primary text-lg"
              />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={submitting}
                >
                  <Camera size={13} />
                  {avatarFile ? "Change photo" : "Upload photo"}
                </Button>
                {avatarFile ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setAvatarFile(null)}
                    disabled={submitting}
                  >
                    <Trash2 size={13} />
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Optional profile picture. PNG, JPG, WEBP or GIF up to 10 MB.
              </p>
              <input
                ref={avatarInputRef}
                type="file"
                accept={AVATAR_ACCEPT.join(",")}
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {(submitting || uploadAvatar.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign Up
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={() => socialSignIn("google")}>
              <FcGoogle className="w-4 h-4" />
              Continue with Google
            </Button>
            <Button variant="outline" onClick={() => socialSignIn("discord")}>
              <FaDiscord className="w-4 h-4" />
              Continue with Discord
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Already have account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
