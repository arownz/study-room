import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  Coffee,
  CloudRain,
  Wind,
  Music,
  Waves,
  TreePine,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPomodoroSessions,
  useCreatePomodoroSession,
  useGetPomodoroPreferences,
  usePutPomodoroPreferences,
  getListPomodoroSessionsQueryKey,
  type PomodoroSessionMode,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const MODE_ORDER: PomodoroSessionMode[] = ["focus", "short_break", "long_break"];

const DEFAULT_SECONDS: Record<PomodoroSessionMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const MODE_LABEL: Record<PomodoroSessionMode, string> = {
  focus: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

const MODE_COLOR: Record<PomodoroSessionMode, string> = {
  focus: "hsl(248,87%,66%)",
  short_break: "hsl(160,80%,45%)",
  long_break: "hsl(190,90%,50%)",
};

function clampSec(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function loadModeSeconds(): Record<PomodoroSessionMode, number> {
  try {
    const raw = localStorage.getItem("studyroom.pomodoro.modeSeconds");
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

function buildModes(sec: Record<PomodoroSessionMode, number>) {
  return MODE_ORDER.map((key) => ({
    key,
    label: MODE_LABEL[key],
    duration: sec[key],
    color: MODE_COLOR[key],
  }));
}

const AMBIENT_SOUNDS = [
  { id: "1", name: "Rain on Window", icon: "CloudRain" as const, active: false },
  { id: "2", name: "Coffee Shop", icon: "Coffee" as const, active: true },
  { id: "3", name: "Deep Focus", icon: "Waves" as const, active: false },
  { id: "4", name: "Forest", icon: "TreePine" as const, active: false },
  { id: "5", name: "White Noise", icon: "Wind" as const, active: false },
  { id: "6", name: "Lo-Fi Beats", icon: "Music" as const, active: false },
];

const soundIcons = {
  Coffee,
  CloudRain,
  Wind,
  Music,
  Waves,
  TreePine,
} as const;

const POMODORO_SESSION_KEY = "studyroom.pomodoro.session.v1";

type PomodoroSessionSnapshot = {
  v: 1;
  modeIdx: number;
  timeLeft: number;
  tasks: { id: string; text: string; done: boolean }[];
  newTask: string;
  sounds: typeof AMBIENT_SOUNDS;
};

function startOfLocalDay(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Pomodoro() {
  const queryClient = useQueryClient();
  const [modes, setModes] = useState(() => buildModes(loadModeSeconds()));
  const [modeIdx, setModeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => modes[0].duration);
  const [running, setRunning] = useState(false);
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newTask, setNewTask] = useState("");
  const [sounds, setSounds] = useState(AMBIENT_SOUNDS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentStartRef = useRef<Date | null>(null);
  const modeIdxRef = useRef(modeIdx);
  const modesRef = useRef(modes);
  const completionFiredRef = useRef(false);
  const prefsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefsHydratedRef = useRef(false);
  const sessionPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mode = modes[modeIdx];
  const progress = 1 - timeLeft / mode.duration;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  const { data: sessionsEnvelope } = useListPomodoroSessions({ limit: 80, offset: 0 });
  const sessions = sessionsEnvelope?.data?.items ?? [];

  const { data: prefsEnvelope } = useGetPomodoroPreferences();
  const putPrefs = usePutPomodoroPreferences();

  const createSession = useCreatePomodoroSession();

  useEffect(() => {
    modeIdxRef.current = modeIdx;
  }, [modeIdx]);

  useEffect(() => {
    modesRef.current = modes;
  }, [modes]);

  useEffect(() => {
    if (!prefsEnvelope?.success || prefsHydratedRef.current) return;
    const p = prefsEnvelope.data;
    let nextSec = loadModeSeconds();
    if (new Date(p.updatedAt).getTime() > 0) {
      nextSec = {
        focus: p.focusSec,
        short_break: p.shortBreakSec,
        long_break: p.longBreakSec,
      };
      localStorage.setItem(
        "studyroom.pomodoro.modeSeconds",
        JSON.stringify({
          focus: p.focusSec,
          short_break: p.shortBreakSec,
          long_break: p.longBreakSec,
        }),
      );
    }
    const nextModes = buildModes(nextSec);
    setModes(nextModes);

    try {
      const raw = localStorage.getItem(POMODORO_SESSION_KEY);
      if (raw) {
        const snap = JSON.parse(raw) as Partial<PomodoroSessionSnapshot>;
        if (snap.v === 1) {
          const idx = Math.min(2, Math.max(0, Math.floor(snap.modeIdx ?? 0)));
          setModeIdx(idx);
          const cap = nextModes[idx]?.duration ?? snap.timeLeft ?? 0;
          const tl =
            typeof snap.timeLeft === "number" && Number.isFinite(snap.timeLeft)
              ? Math.floor(snap.timeLeft)
              : cap;
          setTimeLeft(Math.min(cap, Math.max(0, tl)));
          if (Array.isArray(snap.tasks)) {
            setTasks(
              snap.tasks.filter(
                (t) =>
                  t &&
                  typeof t.id === "string" &&
                  typeof t.text === "string" &&
                  typeof t.done === "boolean",
              ),
            );
          }
          if (typeof snap.newTask === "string") {
            setNewTask(snap.newTask);
          }
          if (Array.isArray(snap.sounds) && snap.sounds.length === AMBIENT_SOUNDS.length) {
            setSounds(snap.sounds as typeof AMBIENT_SOUNDS);
          }
        }
      }
    } catch {
      /* ignore corrupted snapshot */
    }

    prefsHydratedRef.current = true;
  }, [prefsEnvelope]);

  useEffect(() => {
    const sec: Record<PomodoroSessionMode, number> = {
      focus: modes[0].duration,
      short_break: modes[1].duration,
      long_break: modes[2].duration,
    };
    localStorage.setItem("studyroom.pomodoro.modeSeconds", JSON.stringify(sec));
  }, [modes]);

  useEffect(() => {
    const cap = modes[modeIdx].duration;
    setTimeLeft((t) => Math.min(t, cap));
  }, [modes, modeIdx]);

  const todayStats = useMemo(() => {
    const start = startOfLocalDay(new Date()).getTime();
    let focusSec = 0;
    let focusCount = 0;
    for (const s of sessions) {
      const done = new Date(s.completedAt).getTime();
      if (done < start) continue;
      if (s.mode === "focus") {
        focusSec += s.durationActualSec;
        focusCount += 1;
      }
    }
    const focusHours = focusSec / 3600;
    return { focusHours, focusCount };
  }, [sessions]);

  const setMinutesForMode = useCallback(
    (key: PomodoroSessionMode, minutesVal: number) => {
      const sec = clampSec(minutesVal * 60, 60, key === "short_break" ? 60 * 60 : 3 * 60 * 60);
      setModes((prev) => prev.map((m) => (m.key === key ? { ...m, duration: sec } : m)));
      if (prefsSaveTimerRef.current) clearTimeout(prefsSaveTimerRef.current);
      prefsSaveTimerRef.current = setTimeout(() => {
        const m = modesRef.current;
        putPrefs.mutate({
          data: {
            focusSec: m[0]!.duration,
            shortBreakSec: m[1]!.duration,
            longBreakSec: m[2]!.duration,
          },
        });
      }, 900);
    },
    [putPrefs],
  );

  const switchMode = useCallback(
    (idx: number) => {
      setModeIdx(idx);
      setTimeLeft(modesRef.current[idx].duration);
      setRunning(false);
      segmentStartRef.current = null;
      completionFiredRef.current = false;
    },
    [],
  );

  const reset = useCallback(() => {
    setTimeLeft(modesRef.current[modeIdxRef.current].duration);
    setRunning(false);
    segmentStartRef.current = null;
    completionFiredRef.current = false;
  }, []);

  const completeSegment = useCallback(() => {
    const idx = modeIdxRef.current;
    const m = modesRef.current[idx];
    const planned = m.duration;
    const started = segmentStartRef.current ?? new Date();
    segmentStartRef.current = null;
    setRunning(false);
    createSession.mutate({
      data: {
        mode: m.key,
        durationPlannedSec: planned,
        durationActualSec: planned,
        startedAt: started.toISOString(),
        completedAt: new Date().toISOString(),
      },
    });
  }, [createSession]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (!completionFiredRef.current) {
              completionFiredRef.current = true;
              completeSegment();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, completeSegment]);

  useEffect(() => {
    return () => {
      if (prefsSaveTimerRef.current) clearTimeout(prefsSaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!prefsHydratedRef.current) return;
    if (sessionPersistTimerRef.current) clearTimeout(sessionPersistTimerRef.current);
    sessionPersistTimerRef.current = setTimeout(() => {
      try {
        const payload: PomodoroSessionSnapshot = {
          v: 1,
          modeIdx,
          timeLeft,
          tasks,
          newTask,
          sounds,
        };
        localStorage.setItem(POMODORO_SESSION_KEY, JSON.stringify(payload));
      } catch {
        /* ignore quota */
      }
    }, 600);
    return () => {
      if (sessionPersistTimerRef.current) clearTimeout(sessionPersistTimerRef.current);
    };
  }, [modeIdx, timeLeft, tasks, newTask, sounds]);

  const toggleRunning = () => {
    if (timeLeft === 0) {
      setTimeLeft(mode.duration);
      completionFiredRef.current = false;
    }
    setRunning((r) => {
      const next = !r;
      if (!r && next) {
        if (segmentStartRef.current === null) {
          segmentStartRef.current = new Date();
        }
        if (timeLeft === mode.duration) {
          completionFiredRef.current = false;
        }
      }
      return next;
    });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: String(Date.now()), text: newTask, done: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const toggleSound = (id: string) => {
    setSounds((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const refetchSessions = () => {
    void queryClient.invalidateQueries({ queryKey: getListPomodoroSessionsQueryKey() });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {modes.map((m, i) => (
            <button
              key={m.key}
              type="button"
              onClick={() => switchMode(i)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                modeIdx === i
                  ? "text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-muted/50",
              )}
              style={modeIdx === i ? { background: m.color } : {}}
              data-testid={`mode-tab-${m.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="sm:ml-auto">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs" type="button">
              Timer lengths
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", settingsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
              {MODE_ORDER.map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24">{MODE_LABEL[key]}</span>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 w-16 text-xs"
                    value={Math.round(modes.find((m) => m.key === key)!.duration / 60)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v)) setMinutesForMode(key, v);
                    }}
                  />
                  <span className="text-muted-foreground">min</span>
                </label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full border-2",
              i < todayStats.focusCount % 4 ? "border-primary bg-primary" : "border-border",
            )}
          />
        ))}
        <span className="ml-1">
          {todayStats.focusCount} focus session{todayStats.focusCount === 1 ? "" : "s"} today
        </span>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 flex flex-col items-center space-y-6">
          <Card className="border-border/60 w-full">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke={mode.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="text-center z-10">
                  <div
                    className="text-5xl font-bold font-mono tabular-nums tracking-tight"
                    data-testid="timer-display"
                  >
                    {minutes}:{seconds}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">{mode.label}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={reset}
                  type="button"
                  data-testid="button-reset-timer"
                >
                  <RotateCcw size={16} />
                </Button>
                <Button
                  className="h-14 w-14 rounded-full text-lg"
                  style={{ background: mode.color }}
                  onClick={toggleRunning}
                  type="button"
                  data-testid="button-toggle-timer"
                >
                  {running ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => switchMode((modeIdx + 1) % modes.length)}
                  type="button"
                  data-testid="button-skip-mode"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>

              {running && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground italic"
                >
                  Stay focused. You&apos;re doing great.
                </motion.p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Ambient Sounds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {sounds.map((sound) => {
                  const Icon = soundIcons[sound.icon] || Wind;
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => toggleSound(sound.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs",
                        sound.active
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground",
                      )}
                      data-testid={`sound-toggle-${sound.id}`}
                    >
                      <Icon size={16} />
                      <span className="font-medium">{sound.name}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Card className="border-border/60 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                Session Tasks
                <Badge variant="secondary" className="text-[10px]">
                  {tasks.filter((t) => t.done).length}/{tasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => (
                <motion.button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2.5 w-full text-left group"
                  whileHover={{ x: 2 }}
                  data-testid={`pomodoro-task-${task.id}`}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border shrink-0 flex items-center justify-center mt-0.5 transition-all",
                      task.done
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary/50",
                    )}
                  >
                    {task.done && <Check size={10} className="text-primary-foreground" />}
                  </div>
                  <span
                    className={cn(
                      "text-sm leading-snug",
                      task.done && "line-through text-muted-foreground",
                    )}
                  >
                    {task.text}
                  </span>
                </motion.button>
              ))}

              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="text-sm h-8"
                  data-testid="input-new-task"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={addTask}
                  type="button"
                  data-testid="button-add-task"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">Today&apos;s focus</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[10px]" type="button" onClick={refetchSessions}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">
                {todayStats.focusHours.toFixed(1)}
                <span className="text-base font-normal text-muted-foreground ml-1">hrs</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Focus sessions</span>
                  <span className="font-medium">{todayStats.focusCount} today</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, todayStats.focusHours * 20)}%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>

              <div className="pt-1">
                <p className="text-[11px] text-muted-foreground mb-2">Recent sessions</p>
                <ScrollArea className="h-40 pr-2">
                  <ul className="space-y-2 text-xs">
                    {sessions.length === 0 && (
                      <li className="text-muted-foreground italic">Complete a timer to build history.</li>
                    )}
                    {sessions.slice(0, 20).map((s) => (
                      <li
                        key={s.id}
                        className="flex justify-between gap-2 border-b border-border/40 pb-2 last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {MODE_LABEL[s.mode]} · {Math.round(s.durationActualSec / 60)}m
                        </span>
                        <span className="tabular-nums text-[10px] text-muted-foreground">
                          {new Date(s.completedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
