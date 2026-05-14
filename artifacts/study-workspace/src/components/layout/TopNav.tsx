import { useState } from "react";
import { Link } from "wouter";
import { Bell, Search, Sun, Moon, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { shortcutModLabel } from "@/lib/platform";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { useProfile } from "@/features/profile";
import type { NotificationPreferences } from "@/features/profile/types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_META,
} from "@/features/profile/types";

interface TopNavProps {
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  title: string;
}

export function TopNav({ sidebarCollapsed, theme, onThemeToggle, title }: TopNavProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { session, signOut } = useAuth();
  const profileQuery = useProfile();
  const profile = profileQuery.data;

  const sessionUser = session?.user as
    | { name?: string; email?: string; image?: string | null; avatar?: string | null }
    | undefined;

  const userName = profile?.name ?? sessionUser?.name ?? "User";
  const userEmail = profile?.email ?? sessionUser?.email ?? "";
  const avatarUrl =
    profile?.avatar ?? sessionUser?.avatar ?? sessionUser?.image ?? null;

  const notificationKeys = Object.keys(
    NOTIFICATION_PREFERENCE_META,
  ) as (keyof NotificationPreferences)[];

  const prefs = profile?.notificationPreferences;
  const mergedPrefs: NotificationPreferences = prefs
    ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs }
    : DEFAULT_NOTIFICATION_PREFERENCES;

  const enabledChannelCount = notificationKeys.filter((key) => mergedPrefs[key]).length;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-14 items-center border-b bg-background/80 backdrop-blur-md transition-all duration-300 px-4 gap-4",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      <div className="flex-1 flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground hidden md:block">{title}</h1>
        {/* <div className={cn(
          "relative flex items-center rounded-lg border bg-muted/50 transition-all duration-200",
          searchFocused ? "w-64 border-primary/50 shadow-sm shadow-primary/10" : "w-48 border-border"
        )}>
          <Search size={14} className="absolute left-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="border-0 bg-transparent pl-8 pr-8 h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            data-testid="input-search"
          />
          <div className="absolute right-2 flex items-center gap-0.5">
            <kbd className="pointer-events-none rounded border border-border/80 bg-muted/60 px-1 font-mono text-[9px] font-semibold text-muted-foreground">
              {shortcutModLabel()}
            </kbd>
            <kbd className="pointer-events-none rounded border border-border/80 bg-muted/60 px-1 font-mono text-[9px] font-semibold text-muted-foreground">
              K
            </kbd>
          </div>
        </div> */}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 relative"
              data-testid="button-notifications"
              type="button"
            >
              <Bell size={16} />
              {enabledChannelCount > 0 ? (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 flex items-center justify-center text-[9px] bg-primary">
                  {enabledChannelCount}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profileQuery.isLoading ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">Loading preferences…</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto px-1 py-1">
                {notificationKeys.map((key) => {
                  const meta = NOTIFICATION_PREFERENCE_META[key];
                  const on = mergedPrefs[key];
                  return (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-2 rounded-md px-2 py-1.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{meta.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-snug">{meta.description}</p>
                      </div>
                      {on ? (
                        <Check size={14} className="mt-0.5 shrink-0 text-primary" aria-label="On" />
                      ) : (
                        <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground">Off</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings#notifications" className="cursor-pointer">
                Open notification settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onThemeToggle}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full" data-testid="avatar-user-menu">
              <UserAvatar
                src={avatarUrl}
                name={userName}
                className="h-8 w-8 cursor-pointer"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="text-sm font-medium">{userName}</p>
              {userEmail ? (
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="link-profile-settings">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings size={14} />
                Profile settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void signOut()} data-testid="button-logout">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
