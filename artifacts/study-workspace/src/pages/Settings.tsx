import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Palette, KeyboardIcon, Shield, Link, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  IntegrationsCard,
  ProfileSettingsCard,
  useProfile,
  useUpdateProfile,
} from "@/features/profile";
import type { NotificationPreferences } from "@/features/profile/types";
import { DEFAULT_NOTIFICATION_PREFERENCES, NOTIFICATION_PREFERENCE_META } from "@/features/profile/types";
import { resolveShortcutRow, SETTINGS_SHORTCUT_HINTS } from "@/lib/platform";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "shortcuts", label: "Shortcuts", icon: KeyboardIcon },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "privacy", label: "Privacy", icon: Shield },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [notifications, setNotifications] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const { toast } = useToast();
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.replace(/^#/, "");
    if (raw === "notifications") {
      setActiveSection("notifications");
    }
  }, []);

  useEffect(() => {
    const prefs = profileQuery.data?.notificationPreferences;
    if (!prefs) return;
    setNotifications({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs });
  }, [profileQuery.data?.notificationPreferences]);

  const saveNotifications = async () => {
    try {
      await updateProfile.mutateAsync({ notificationPreferences: notifications });
      toast({
        title: "Preferences saved",
        description: "Notification settings are stored on your account.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update notification preferences.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex gap-6 h-full">
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

      <div className="flex-1 space-y-5">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeSection === "profile" && <ProfileSettingsCard />}

          {activeSection === "notifications" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(NOTIFICATION_PREFERENCE_META) as (keyof NotificationPreferences)[]).map(
                  (key) => {
                    const info = NOTIFICATION_PREFERENCE_META[key];
                    const value = notifications[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium">{info.title}</p>
                            <p className="text-xs text-muted-foreground">{info.description}</p>
                          </div>
                          <Switch
                            checked={value}
                            onCheckedChange={(v) =>
                              setNotifications((prev) => ({ ...prev, [key]: v }))
                            }
                            data-testid={`switch-${key}`}
                          />
                        </div>
                        <Separator />
                      </div>
                    );
                  },
                )}
                <Button
                  onClick={() => void saveNotifications()}
                  className="gap-1.5 mt-2"
                  disabled={updateProfile.isPending || profileQuery.isLoading}
                  data-testid="button-save-notifications"
                >
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
                        className={`border rounded-lg p-3 text-sm font-medium transition-all ${
                          t === "Dark"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-border/80 text-muted-foreground"
                        }`}
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
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          i === 0 ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                        }`}
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
                  {SETTINGS_SHORTCUT_HINTS.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0"
                    >
                      <span className="text-sm">{s.action}</span>
                      <div className="flex gap-1">
                        {resolveShortcutRow(s.keys).map((k) => (
                          <kbd
                            key={k}
                            className="px-1.5 py-0.5 rounded border border-border bg-muted text-xs font-mono font-semibold"
                          >
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

          {activeSection === "integrations" && (
            <IntegrationsCard
              user={profileQuery.data}
              isLoading={profileQuery.isLoading}
            />
          )}

          {activeSection === "privacy" && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage your data, visibility, and privacy preferences.
                </p>
                <Badge variant="secondary" className="mt-4">
                  Coming soon
                </Badge>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
