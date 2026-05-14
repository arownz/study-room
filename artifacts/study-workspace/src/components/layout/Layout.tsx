import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { PomodoroAmbientAudioHost } from "@/features/pomodoro/components/PomodoroAmbientAudioHost";
import { PomodoroFloatingWidget } from "@/features/pomodoro/components/PomodoroFloatingWidget";
import { PomodoroSpotifyPortal } from "@/features/pomodoro/components/PomodoroSpotifyPortal";
import { PomodoroSpotifySlotProvider } from "@/features/pomodoro/pomodoro-spotify-slot-context";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/notes": "Notes",
  "/flashcards": "Flashcards",
  "/rooms": "Study Rooms",
  "/ai-tutor": "AI Tutor",
  "/whiteboard": "Whiteboard",
  "/pomodoro": "Pomodoro",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [location] = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = stored || "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  const title = pageTitles[location] || "StudyRoom";

  return (
    <div className="min-h-screen bg-background">
      <PomodoroSpotifySlotProvider>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <TopNav
          sidebarCollapsed={collapsed}
          theme={theme}
          onThemeToggle={toggleTheme}
          title={title}
        />
        <main
          className={cn(
            "pt-14 transition-all duration-300",
            collapsed ? "pl-16" : "pl-64",
          )}
        >
          <div className="min-h-[calc(100vh-3.5rem)] p-6">
            {children}
          </div>
        </main>
        <PomodoroSpotifyPortal />
        <PomodoroAmbientAudioHost />
        <PomodoroFloatingWidget />
      </PomodoroSpotifySlotProvider>
    </div>
  );
}
