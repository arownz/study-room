import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Palette, KeyboardIcon, Shield, Link, Save, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "shortcuts", label: "Shortcuts", icon: KeyboardIcon },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "privacy", label: "Privacy", icon: Shield },
];

const shortcuts = [
  { keys: ["⌘", "K"], action: "Open command palette" },
  { keys: ["⌘", "N"], action: "New note" },
  { keys: ["⌘", "F"], action: "Search" },
  { keys: ["⌘", "/"], action: "Toggle sidebar" },
  { keys: ["⌘", "P"], action: "Start Pomodoro" },
  { keys: ["⌘", "Shift", "A"], action: "Open AI Tutor" },
  { keys: ["J / K"], action: "Navigate notes list" },
  { keys: ["Space"], action: "Flip flashcard" },
  { keys: ["E"], action: "Edit selected note" },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [notifications, setNotifications] = useState({
    studyReminders: true,
    roomInvites: true,
    aiSuggestions: false,
    streakAlerts: true,
    weeklyDigest: true,
  });
  const { toast } = useToast();

  const save = () => toast({ title: "Settings saved", description: "Your preferences have been updated." });

  return (
    <div className="max-w-4xl mx-auto flex gap-6 h-full">
      {/* Nav */}
      <aside className="w-44 flex-shrink-0 space-y-0.5">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
              activeSection === id
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            data-testid={`settings-nav-${id}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 space-y-5">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === "profile" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">AC</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-change-avatar">
                      <Camera size={13} /> Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG or GIF, max 2MB</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name</Label>
                    <Input defaultValue="Alex" data-testid="input-first-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name</Label>
                    <Input defaultValue="Chen" data-testid="input-last-name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input defaultValue="alex@studyai.app" type="email" data-testid="input-email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Username</Label>
                    <Input defaultValue="alexchen" data-testid="input-username" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">Academic Level</Label>
                    <Select defaultValue="undergraduate">
                      <SelectTrigger data-testid="select-academic-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="postgraduate">Postgraduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={save} className="gap-1.5" data-testid="button-save-profile">
                  <Save size={14} /> Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => {
                  const labels: Record<string, { title: string; desc: string }> = {
                    studyReminders: { title: "Study Reminders", desc: "Daily reminders to keep your streak alive" },
                    roomInvites: { title: "Room Invites", desc: "When someone invites you to a study room" },
                    aiSuggestions: { title: "AI Suggestions", desc: "Personalized study recommendations from AI" },
                    streakAlerts: { title: "Streak Alerts", desc: "Warnings when your streak is at risk" },
                    weeklyDigest: { title: "Weekly Digest", desc: "Your weekly study summary every Sunday" },
                  };
                  const info = labels[key];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">{info.title}</p>
                          <p className="text-xs text-muted-foreground">{info.desc}</p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [key]: v }))}
                          data-testid={`switch-${key}`}
                        />
                      </div>
                      <Separator />
                    </div>
                  );
                })}
                <Button onClick={save} className="gap-1.5 mt-2" data-testid="button-save-notifications">
                  <Save size={14} /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Dark", "Light", "System"].map((t) => (
                      <button
                        key={t}
                        className={`border rounded-lg p-3 text-sm font-medium transition-all ${t === "Dark" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-border/80 text-muted-foreground"}`}
                        data-testid={`theme-option-${t.toLowerCase()}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Accent Color</Label>
                  <div className="flex gap-2">
                    {["hsl(248,87%,66%)", "hsl(160,80%,45%)", "hsl(340,85%,65%)", "hsl(30,90%,55%)", "hsl(190,90%,50%)"].map((c, i) => (
                      <button
                        key={i}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${i === 0 ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ background: c }}
                        data-testid={`color-option-${i}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Font Size</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger data-testid="select-font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "shortcuts" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                      <span className="text-sm">{s.action}</span>
                      <div className="flex gap-1">
                        {s.keys.map((k) => (
                          <kbd key={k} className="px-1.5 py-0.5 rounded border border-border bg-muted text-xs font-mono font-semibold">
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(activeSection === "integrations" || activeSection === "privacy") && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base capitalize">{activeSection}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {activeSection === "integrations"
                    ? "Connect external tools like Notion, Google Calendar, and Anki to sync your study data."
                    : "Manage your data, visibility, and privacy preferences."}
                </p>
                <Badge variant="secondary" className="mt-4">Coming soon</Badge>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
