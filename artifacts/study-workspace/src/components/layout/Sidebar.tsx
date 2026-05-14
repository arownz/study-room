import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Users, 
  MessageSquare, 
  PenTool, 
  Timer, 
  BarChart2, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/notes", label: "Notes", icon: FileText },
    { href: "/flashcards", label: "Flashcards", icon: Layers },
    { href: "/rooms", label: "Study Rooms", icon: Users },
    { href: "/ai-tutor", label: "AI Tutor", icon: MessageSquare },
    { href: "/whiteboard", label: "Whiteboard", icon: PenTool },
    { href: "/pomodoro", label: "Pomodoro", icon: Timer },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
              <img src="/logo1.png" alt="StudyRoom" className="h-8 w-8 object-contain" />
            </div>
            StudyRoom
          </div>
        )}
        {collapsed && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
            <img src="/logo1.png" alt="StudyRoom" className="h-8 w-8 object-contain" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 hidden md:flex"
          onClick={onToggle}
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon size={18} className={cn(isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
