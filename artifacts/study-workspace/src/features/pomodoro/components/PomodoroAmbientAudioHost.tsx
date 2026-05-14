import { useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Minimize, Minimize2, Minimize2Icon, Pause, Play, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AMBIENT_SOUNDS,
  deriveAmbientOutputFromSnapshot,
  readSessionSnapshot,
  subscribePomodoroSync,
  writeSessionSnapshot,
  type PomodoroSessionSnapshot,
} from "../persistence";
import { FaWindowMinimize } from "react-icons/fa";

const LOCAL_FLOAT_DISMISSED_KEY = "studyroom.pomodoro.ui.localFloatDismissed";

function loadLocalFloatDismissed(): boolean {
  try {
    return localStorage.getItem(LOCAL_FLOAT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveLocalFloatDismissed(v: boolean) {
  try {
    if (v) localStorage.setItem(LOCAL_FLOAT_DISMISSED_KEY, "1");
    else localStorage.removeItem(LOCAL_FLOAT_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Plays local ambient MP3s from the persisted session so audio survives leaving `/pomodoro`.
 * Spotify is handled separately by {@link PomodoroSpotifyPortal}.
 */
export function PomodoroAmbientAudioHost() {
  const [location, setLocation] = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const boundSrcRef = useRef<string | null>(null);
  const [snap, setSnap] = useState<PomodoroSessionSnapshot | null>(() => readSessionSnapshot());
  const [localFloatDismissed, setLocalFloatDismissed] = useState(loadLocalFloatDismissed);

  useEffect(() => {
    return subscribePomodoroSync((next) => {
      setSnap(next ?? readSessionSnapshot());
    });
  }, []);

  const ambientOut = snap ? deriveAmbientOutputFromSnapshot(snap) : "off";
  const active = snap?.sounds.find((s) => s.active);
  const activeSound = snap?.sounds.find((s) => s.active) ?? AMBIENT_SOUNDS.find((s) => s.active) ?? null;
  const src =
    ambientOut === "local" && active?.sourceType === "audio" && active.audioUrl ? active.audioUrl : null;
  const shouldPlay = Boolean(snap?.ambientPlaying && src);
  const onPomodoro = location.startsWith("/pomodoro");
  const localActive = ambientOut === "local" && Boolean(src);

  useEffect(() => {
    if (!localActive && localFloatDismissed) {
      setLocalFloatDismissed(false);
      saveLocalFloatDismissed(false);
    }
  }, [localActive, localFloatDismissed]);

  useEffect(() => {
    if (!src) {
      boundSrcRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
      return;
    }

    let audio = audioRef.current;
    if (!audio || boundSrcRef.current !== src) {
      audio?.pause();
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      audioRef.current = audio;
      boundSrcRef.current = src;
    }

    const el = audioRef.current;
    if (!el) return;
    el.volume = snap?.ambientVolume ?? 0.45;

    if (!shouldPlay) {
      el.pause();
      return;
    }

    void el.play().catch(() => {
      /* autoplay blocked — user can press play on Pomodoro page */
    });
  }, [shouldPlay, snap?.ambientVolume, src]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      boundSrcRef.current = null;
    };
  }, []);

  const setLocalPlaying = (nextPlaying: boolean) => {
    if (!snap) return;
    writeSessionSnapshot({
      ...snap,
      v: 3,
      ambientOutput: "local",
      ambientPlaying: nextPlaying,
    });
  };

  if (onPomodoro || !localActive) {
    return null;
  }

  if (localFloatDismissed) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="pointer-events-auto fixed bottom-6 right-6 z-46 h-9 gap-2 rounded-full px-3 shadow-md"
        title="Show local ambient player"
        onClick={() => {
          setLocalFloatDismissed(false);
          saveLocalFloatDismissed(false);
        }}
      >
        <Maximize2 size={14} />
        <span className="text-xs">Ambient</span>
      </Button>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-46">
      <div
        className={cn(
          "pointer-events-auto w-[min(calc(100vw-3rem),380px)] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur-xl",
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ambient</p>
            <p className="truncate text-sm font-semibold">{activeSound?.name ?? "Local audio"}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Open Pomodoro page"
              onClick={() => setLocation("/pomodoro")}
            >
              <ExternalLink size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Hide player"
              onClick={() => {
                setLocalFloatDismissed(true);
                saveLocalFloatDismissed(true);
              }}
            >
              <Minimize size={14} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-xl"
            onClick={() => setLocalPlaying(!shouldPlay)}
          >
            {shouldPlay ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            <span className="ml-1.5">{shouldPlay ? "Pause" : "Play"}</span>
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round((snap?.ambientVolume ?? 0.45) * 100)}
            onChange={(event) => {
              if (!snap) return;
              writeSessionSnapshot({
                ...snap,
                v: 3,
                ambientOutput: "local",
                ambientVolume: Number(event.target.value) / 100,
              });
            }}
            className="h-2 flex-1 accent-primary"
            aria-label="Ambient volume"
          />
        </div>
      </div>
    </div>
  );
}
