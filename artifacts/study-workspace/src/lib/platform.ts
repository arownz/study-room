/** Whether the UA looks like Apple (macOS, iPad with desktop UA, etc.). */
export function isAppleOperatingSystem(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  const platform = (navigator.platform ?? "").toLowerCase();
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  if (platform.includes("mac")) return true;
  // iPad OS 13+ often reports MacIntel + touch
  if (platform === "macintel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

/** Primary shortcut modifier label (⌘ on Mac, “Ctrl” on Windows/Linux). */
export function shortcutModLabel(): string {
  return isAppleOperatingSystem() ? "⌘" : "Ctrl";
}

/** Optional alternative glyph pair for ⌃ on non-Apple (we use spelled “Ctrl” for clarity). */
export function shortcutShiftLabel(): string {
  return "Shift";
}

/** Sentinel token mapped to ⌘ vs Ctrl via {@link shortcutModLabel}. */
export const MOD_SENTINEL = "__MOD__" as const;

export type ShortcutSeed = readonly (string | typeof MOD_SENTINEL)[];

export interface ShortcutHint {
  readonly action: string;
  readonly keys: ShortcutSeed;
}

/** Replace {@link MOD_SENTINEL} with platform-specific modifier label. */
export function resolveShortcutRow(keys: ShortcutSeed): string[] {
  return keys.map((key) =>
    key === MOD_SENTINEL ? shortcutModLabel() : key,
  );
}

export const SETTINGS_SHORTCUT_HINTS: ShortcutHint[] = [
  {
    action: "Open command palette",
    keys: [MOD_SENTINEL, "K"],
  },
  {
    action: "New note",
    keys: [MOD_SENTINEL, "N"],
  },
  {
    action: "Search",
    keys: [MOD_SENTINEL, "F"],
  },
  {
    action: "Toggle sidebar",
    keys: [MOD_SENTINEL, "/"],
  },
  {
    action: "Start Pomodoro",
    keys: [MOD_SENTINEL, "P"],
  },
  {
    action: "Open AI Tutor",
    keys: [MOD_SENTINEL, shortcutShiftLabel(), "A"],
  },
  {
    action: "Navigate notes list",
    keys: ["J / K"],
  },
  {
    action: "Flip flashcard",
    keys: ["Space"],
  },
  {
    action: "Edit selected note",
    keys: ["E"],
  },
];
