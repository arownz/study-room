import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { Mail } from "lucide-react";
import {
  findProviderAccount,
  isProviderConnected,
  useProfile,
  type ConnectedAccount,
  type ProfileUser,
} from "@/features/profile";

interface ProviderRow {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
}

const PROVIDERS: ProviderRow[] = [
  {
    id: "google",
    label: "Google",
    description: "Sign in with your Google account.",
    icon: <FcGoogle className="h-5 w-5" />,
  },
  {
    id: "discord",
    label: "Discord",
    description: "Sign in with your Discord account.",
    icon: <FaDiscord className="h-5 w-5 text-[#5865F2]" />,
  },
  {
    id: "credential",
    label: "Email & password",
    description: "Local credential set during sign-up.",
    icon: <Mail className="h-5 w-5 text-muted-foreground" />,
  },
];

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface IntegrationsCardProps {
  user?: ProfileUser;
  isLoading: boolean;
}

export function IntegrationsCard({ user, isLoading }: IntegrationsCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Connected Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))
        ) : (
          PROVIDERS.map((provider) => (
            <ProviderRowItem
              key={provider.id}
              provider={provider}
              account={findProviderAccount(user?.accounts, provider.id)}
              connected={isProviderConnected(user?.accounts, provider.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface ProviderRowItemProps {
  provider: ProviderRow;
  account: ConnectedAccount | undefined;
  connected: boolean;
}

function ProviderRowItem({ provider, account, connected }: ProviderRowItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
          {provider.icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{provider.label}</p>
          <p className="text-xs text-muted-foreground truncate">
            {connected && account
              ? `Linked · since ${formatDate(account.createdAt)}`
              : provider.description}
          </p>
        </div>
      </div>
      <Badge variant={connected ? "default" : "secondary"}>
        {connected ? "Connected" : "Not linked"}
      </Badge>
    </div>
  );
}
