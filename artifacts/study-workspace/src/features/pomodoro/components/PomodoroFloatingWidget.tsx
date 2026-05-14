import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListPomodoroSessionsQueryKey,
  useCreatePomodoroSession,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildModes,
  createDefaultPomodoroSnapshot,
  deriveAmbientOutputFromSnapshot,
  loadModeSeconds,
  MODE_COLOR,
  MODE_LABEL,
  readSessionSnapshot,
  subscribePomodoroSync,
  writeSessionSnapshot,
  type PomodoroSessionSnapshot,
} from "../persistence";

const TIMER_FLOAT_DISMISSED_KEY = "studyroom.pomodoro.ui.timerFloatDismissed";

function loadTimerFloatDismissed(): boolean {
  try {
    return localStorage.getItem(TIMER_FLOAT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function saveTimerFloatDismissed(v: boolean) {
  try {
    if (v) localStorage.setItem(TIMER_FLOAT_DISMISSED_KEY, "1");
    else localStorage.removeItem(TIMER_FLOAT_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function PomodoroFloatingWidget() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createSession = useCreatePomodoroSession();
  const [snapshot, setSnapshot] = useState<PomodoroSessionSnapshot | null>(null);
  const [modeSeconds, setModeSeconds] = useState(() => loadModeSeconds());
  const [now, setNow] = useState(() => Date.now());
  const [timerFloatDismissed, setTimerFloatDismissed] = useState(loadTimerFloatDismissed);
  const completionFiredRef = useRef(false);
  const modes = buildModes(modeSeconds);

  const activeSnapshot = snapshot ?? createDefaultPomodoroSnapshot();
  const mode = modes[Math.min(modes.length - 1, Math.max(0, activeSnapshot.modeIdx))] ?? modes[0];
  const remaining =
    activeSnapshot.running && activeSnapshot.runEndsAtMs !== null
      ? Math.max(0, Math.ceil((activeSnapshot.runEndsAtMs - now) / 1000))
      : activeSnapshot.timeLeft;
  const progress = mode.duration > 0 ? 1 - remaining / mode.duration : 0;

  const syncFromStorage = useCallback((next: PomodoroSessionSnapshot | null) => {
    setSnapshot(next);
    setModeSeconds(loadModeSeconds());
  }, []);

  useEffect(() => {
    syncFromStorage(readSessionSnapshot());
    return subscribePomodoroSync(syncFromStorage);
  }, [syncFromStorage]);

  useEffect(() => {
    if (!activeSnapshot.running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [activeSnapshot.running]);

  const snapRunning = activeSnapshot.running;
  const snapRunEndsAtMs = activeSnapshot.runEndsAtMs;
  const modeKey = mode.key;
  const modeDuration = mode.duration;

  useEffect(() => {
    if (!snapRunning || snapRunEndsAtMs === null) {
      completionFiredRef.current = false;
      return;
    }
    if (remaining > 0 || completionFiredRef.current) return;
    completionFiredRef.current = true;
    const live = readSessionSnapshot() ?? createDefaultPomodoroSnapshot();
    const startedAt = live.segmentStartedAt ? new Date(live.segmentStartedAt) : new Date();
    const completedAt = new Date();
    const durationActualSec = Math.max(
      1,
      Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
    );
    createSession.mutate(
      {
        data: {
          mode: modeKey,
          durationPlannedSec: modeDuration,
          durationActualSec,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
        },
      },
      {
        onSettled: () => {
          void queryClient.invalidateQueries({ queryKey: getListPomodoroSessionsQueryKey() });
        },
      },
    );
    writeSessionSnapshot({
      ...live,
      v: 3,
      timeLeft: 0,
      running: false,
      runEndsAtMs: null,
      segmentStartedAt: null,
      ambientOutput: live.ambientOutput ?? deriveAmbientOutputFromSnapshot(live),
    });
  }, [createSession, modeDuration, modeKey, queryClient, remaining, snapRunEndsAtMs, snapRunning]);

  const toggleRunning = useCallback(() => {
    const current = readSessionSnapshot() ?? activeSnapshot;
    const nextTime = current.timeLeft === 0 ? mode.duration : current.timeLeft;
    if (current.running) {
      const pausedRemaining =
        current.runEndsAtMs === null ? current.timeLeft : Math.max(0, Math.ceil((current.runEndsAtMs - Date.now()) / 1000));
      writeSessionSnapshot({
        ...current,
        v: 3,
        timeLeft: pausedRemaining,
        running: false,
        runEndsAtMs: null,
        ambientOutput: current.ambientOutput ?? deriveAmbientOutputFromSnapshot(current),
      });
      return;
    }
    const freshSegment =
      current.timeLeft === 0 || current.timeLeft === mode.duration || current.segmentStartedAt === null;
    writeSessionSnapshot({
      ...current,
      v: 3,
      timeLeft: nextTime,
      running: true,
      runEndsAtMs: Date.now() + nextTime * 1000,
      segmentStartedAt: freshSegment ? new Date().toISOString() : current.segmentStartedAt,
      ambientOutput: current.ambientOutput ?? deriveAmbientOutputFromSnapshot(current),
    });
  }, [activeSnapshot, mode.duration]);

  const resetTimer = useCallback(() => {
    const current = readSessionSnapshot() ?? activeSnapshot;
    writeSessionSnapshot({
      ...current,
      v: 3,
      timeLeft: mode.duration,
      running: false,
      runEndsAtMs: null,
      segmentStartedAt: null,
      ambientOutput: current.ambientOutput ?? deriveAmbientOutputFromSnapshot(current),
    });
  }, [activeSnapshot, mode.duration]);

  if (location.startsWith("/pomodoro")) return null;
  if (!snapshot) return null;

  if (timerFloatDismissed) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="pointer-events-auto fixed right-6 top-20 z-40 h-9 gap-2 rounded-full px-3 shadow-md"
        title="Show Pomodoro timer"
        onClick={() => {
          setTimerFloatDismissed(false);
          saveTimerFloatDismissed(false);
        }}
      >
        <Maximize2 size={14} />
        <span className="text-xs">Timer</span>
      </Button>
    );
  }

  return (
    <div className="pointer-events-none fixed right-6 top-20 z-40">
      <div className="pointer-events-auto w-[248px] rounded-2xl border border-border/70 bg-background/92 p-3 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pomodoro</p>
            <p className="truncate text-sm font-semibold">{MODE_LABEL[mode.key]}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Open full Pomodoro"
              onClick={() => setLocation("/pomodoro")}
            >
              <ExternalLink size={15} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              title="Hide floating timer"
              onClick={() => {
                setTimerFloatDismissed(true);
                saveTimerFloatDismissed(true);
              }}
            >
              <X size={15} />
            </Button>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70"
              style={{ color: MODE_COLOR[mode.key] }}
            >
              <Timer size={16} />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-end justify-between gap-3">
            <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
              {formatRemaining(remaining)}
            </span>
            <span className="text-[11px] text-muted-foreground">{activeSnapshot.running ? "Running" : "Paused"}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-[width] duration-300")}
              style={{
                width: `${Math.max(4, Math.min(100, progress * 100))}%`,
                backgroundColor: MODE_COLOR[mode.key],
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 rounded-xl"
            onClick={toggleRunning}
            style={{ backgroundColor: MODE_COLOR[mode.key] }}
            data-testid="floating-pomodoro-toggle"
          >
            {activeSnapshot.running ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            <span className="ml-1.5">{activeSnapshot.running ? "Pause" : "Start"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={resetTimer}
            data-testid="floating-pomodoro-reset"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
