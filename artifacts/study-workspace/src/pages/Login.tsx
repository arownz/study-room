import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { authClient } from "@/lib/auth/auth-client";
import { signInSchema, type SignInInput } from "@/lib/auth/validation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";

const defaultValues: SignInInput = {
  email: "",
  password: "",
};

export default function Login() {
  const [form, setForm] = useState<SignInInput>(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && session) {
      navigate("/");
    }
  }, [isLoading, session, navigate]);

  const submitEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message ?? "Check form values",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: `${window.location.origin}/`,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
      });
      return;
    }

    navigate("/");
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
          <CardTitle className="text-2xl">Login to StudyRoom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={submitEmailSignIn}>
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
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
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
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
