import { useState } from "react";
import { Bell, Search, Sun, Moon, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TopNavProps {
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  title: string;
}

export function TopNav({ sidebarCollapsed, theme, onThemeToggle, title }: TopNavProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-14 items-center border-b bg-background/80 backdrop-blur-md transition-all duration-300 px-4 gap-4",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      <div className="flex-1 flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground hidden md:block">{title}</h1>
        <div className={cn(
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
            <Command size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          data-testid="button-notifications"
        >
          <Bell size={16} />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-primary">
            3
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onThemeToggle}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <Avatar className="h-8 w-8 cursor-pointer" data-testid="avatar-user">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            AC
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
