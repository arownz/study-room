import type { PomodoroSessionMode } from "@workspace/api-client-react";

export const MODE_ORDER: PomodoroSessionMode[] = ["focus", "short_break", "long_break"];

export const DEFAULT_SECONDS: Record<PomodoroSessionMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

export const MODE_LABEL: Record<PomodoroSessionMode, string> = {
  focus: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

export const MODE_COLOR: Record<PomodoroSessionMode, string> = {
  focus: "hsl(248,87%,66%)",
  short_break: "hsl(160,80%,45%)",
  long_break: "hsl(190,90%,50%)",
};

export const POMODORO_SESSION_KEY = "studyroom.pomodoro.session.v1";
export const POMODORO_MODE_SECONDS_KEY = "studyroom.pomodoro.modeSeconds";
export const POMODORO_SYNC_EVENT = "studyroom:pomodoro-sync";

/** Served from `artifacts/study-workspace/public/audio/pomodoro/` (Vite `public/` root). */
export function pomodoroAmbientAssetUrl(fileName: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}audio/pomodoro/${fileName}`;
}

export interface AmbientSoundOption {
  id: string;
  name: string;
  icon: "CloudRain" | "Coffee" | "Waves" | "TreePine" | "Wind" | "Music";
  active: boolean;
  sourceType: "audio" | "spotify";
  audioUrl?: string;
  sourceUrl: string;
  sourceLabel: string;
}

export const AMBIENT_SOUNDS: AmbientSoundOption[] = [
  {
    id: "rain-window",
    name: "Rain on Window",
    icon: "CloudRain",
    active: false,
    sourceType: "audio",
    audioUrl: pomodoroAmbientAssetUrl("rain-window.mp3"),
    sourceUrl: "https://bigsoundbank.com/apartment-open-window-s2388.html",
    sourceLabel: "BigSoundBank",
  },
  {
    id: "coffee-shop",
    name: "Coffee Shop",
    icon: "Coffee",
    active: true,
    sourceType: "audio",
    audioUrl: pomodoroAmbientAssetUrl("coffee-shop.mp3"),
    sourceUrl: "https://bigsoundbank.com/coffee-shop-at-the-capucins-s2561.html",
    sourceLabel: "BigSoundBank",
  },
  {
    id: "deep-focus",
    name: "Deep Focus",
    icon: "Waves",
    active: false,
    sourceType: "audio",
    audioUrl: pomodoroAmbientAssetUrl("deep-focus.mp3"),
    sourceUrl: "https://bigsoundbank.com/sound-atmosphere-in-a-house-s2458.html",
    sourceLabel: "BigSoundBank",
  },
  {
    id: "forest",
    name: "Forest",
    icon: "TreePine",
    active: false,
    sourceType: "audio",
    audioUrl: pomodoroAmbientAssetUrl("forest.mp3"),
    sourceUrl: "https://bigsoundbank.com/forest-on-the-edge-s0905.html",
    sourceLabel: "BigSoundBank",
  },
  {
    id: "wind-noise",
    name: "Wind Noise",
    icon: "Wind",
    active: false,
    sourceType: "audio",
    audioUrl: pomodoroAmbientAssetUrl("wind-noise.mp3"),
    sourceUrl: "https://bigsoundbank.com/wind-noise-s0595.html",
    sourceLabel: "BigSoundBank",
  },
  {
    id: "lofi-beats",
    name: "Lo-Fi Beats",
    icon: "Music",
    active: false,
    sourceType: "spotify",
    sourceUrl: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
    sourceLabel: "Spotify",
  },
];

export type PomodoroAmbientOutput = "off" | "local" | "spotify";

export type PomodoroSessionSnapshot = {
  v: 3;
  updatedAtMs: number;
  modeIdx: number;
  timeLeft: number;
  running: boolean;
  runEndsAtMs: number | null;
  segmentStartedAt: string | null;
  tasks: { id: string; text: string; done: boolean }[];
  newTask: string;
  sounds: AmbientSoundOption[];
  ambientPlaying: boolean;
  ambientVolume: number;
  ambientOutput: PomodoroAmbientOutput;
};

export function mergeSoundsFromSaved(saved: unknown): AmbientSoundOption[] {
  const savedArr = Array.isArray(saved) ? (saved as AmbientSoundOption[]) : [];
  return AMBIENT_SOUNDS.map((def) => {
    const prev = savedArr.find((p) => p.id === def.id);
    if (!prev) return { ...def };
    return {
      ...def,
      active: prev.active,
    };
  });
}

export function deriveAmbientOutputFromSnapshot(snap: PomodoroSessionSnapshot): PomodoroAmbientOutput {
  const explicit = snap.ambientOutput;
  if (explicit === "off" || explicit === "local" || explicit === "spotify") {
    return explicit;
  }
  const active = snap.sounds.find((s) => s.active);
  if (!active) return "off";
  if (active.sourceType === "spotify") return "spotify";
  if (snap.ambientPlaying && active.sourceType === "audio") return "local";
  return "off";
}

export function createDefaultPomodoroSnapshot(): PomodoroSessionSnapshot {
  return {
    v: 3,
    updatedAtMs: Date.now(),
    modeIdx: 0,
    timeLeft: DEFAULT_SECONDS.focus,
    running: false,
    runEndsAtMs: null,
    segmentStartedAt: null,
    tasks: [],
    newTask: "",
    sounds: mergeSoundsFromSaved(AMBIENT_SOUNDS),
    ambientPlaying: false,
    ambientVolume: 0.45,
    ambientOutput: "off",
  };
}

export function normalizeSessionSnapshot(raw: unknown): PomodoroSessionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<PomodoroSessionSnapshot>;
  if (o.v !== 3) return null;
  const base = createDefaultPomodoroSnapshot();
  const merged: PomodoroSessionSnapshot = {
    ...base,
    ...o,
    sounds: mergeSoundsFromSaved(o.sounds),
    tasks: Array.isArray(o.tasks)
      ? o.tasks.filter(
          (task) =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.done === "boolean",
        )
      : base.tasks,
    newTask: typeof o.newTask === "string" ? o.newTask : base.newTask,
    modeIdx: typeof o.modeIdx === "number" ? o.modeIdx : base.modeIdx,
    timeLeft: typeof o.timeLeft === "number" ? o.timeLeft : base.timeLeft,
    running: typeof o.running === "boolean" ? o.running : base.running,
    runEndsAtMs: typeof o.runEndsAtMs === "number" || o.runEndsAtMs === null ? (o.runEndsAtMs ?? null) : base.runEndsAtMs,
    segmentStartedAt:
      typeof o.segmentStartedAt === "string" || o.segmentStartedAt === null
        ? (o.segmentStartedAt ?? null)
        : base.segmentStartedAt,
    ambientPlaying: typeof o.ambientPlaying === "boolean" ? o.ambientPlaying : base.ambientPlaying,
    ambientVolume:
      typeof o.ambientVolume === "number" && Number.isFinite(o.ambientVolume)
        ? Math.max(0, Math.min(1, o.ambientVolume))
        : base.ambientVolume,
    updatedAtMs: typeof o.updatedAtMs === "number" ? o.updatedAtMs : base.updatedAtMs,
  };
  if (o.ambientOutput === "off" || o.ambientOutput === "local" || o.ambientOutput === "spotify") {
    merged.ambientOutput = o.ambientOutput;
  } else {
    merged.ambientOutput = deriveAmbientOutputFromSnapshot(merged);
  }
  return merged;
}

export function clampSec(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function loadModeSeconds(): Record<PomodoroSessionMode, number> {
  try {
    const raw = localStorage.getItem(POMODORO_MODE_SECONDS_KEY);
    if (!raw) return { ...DEFAULT_SECONDS };
    const parsed = JSON.parse(raw) as Partial<Record<PomodoroSessionMode, number>>;
    return {
      focus: clampSec(parsed.focus ?? DEFAULT_SECONDS.focus, 60, 3 * 60 * 60),
      short_break: clampSec(parsed.short_break ?? DEFAULT_SECONDS.short_break, 60, 60 * 60),
      long_break: clampSec(parsed.long_break ?? DEFAULT_SECONDS.long_break, 60, 3 * 60 * 60),
    };
  } catch {
    return { ...DEFAULT_SECONDS };
  }
}

export function buildModes(sec: Record<PomodoroSessionMode, number>) {
  return MODE_ORDER.map((key) => ({
    key,
    label: MODE_LABEL[key],
    duration: sec[key],
    color: MODE_COLOR[key],
  }));
}

export function readSessionSnapshot(): PomodoroSessionSnapshot | null {
  try {
    const raw = localStorage.getItem(POMODORO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return normalizeSessionSnapshot(parsed);
  } catch {
    return null;
  }
}

export function writeSessionSnapshot(snapshot: Omit<PomodoroSessionSnapshot, "updatedAtMs">): PomodoroSessionSnapshot {
  const payload: PomodoroSessionSnapshot = {
    ...snapshot,
    updatedAtMs: Date.now(),
  };
  localStorage.setItem(POMODORO_SESSION_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent<PomodoroSessionSnapshot>(POMODORO_SYNC_EVENT, { detail: payload }));
  return payload;
}

export function persistModeSeconds(next: Record<PomodoroSessionMode, number>): void {
  localStorage.setItem(POMODORO_MODE_SECONDS_KEY, JSON.stringify(next));
}

export function subscribePomodoroSync(onSync: (snapshot: PomodoroSessionSnapshot | null) => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== POMODORO_SESSION_KEY && event.key !== POMODORO_MODE_SECONDS_KEY) return;
    onSync(readSessionSnapshot());
  };
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<PomodoroSessionSnapshot | undefined>).detail;
    const next = detail ? (normalizeSessionSnapshot(detail) ?? readSessionSnapshot()) : readSessionSnapshot();
    onSync(next);
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(POMODORO_SYNC_EVENT, onCustom as EventListener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(POMODORO_SYNC_EVENT, onCustom as EventListener);
  };
}
