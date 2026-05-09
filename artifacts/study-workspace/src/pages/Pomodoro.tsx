import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Check, Coffee, CloudRain, Wind, Music, Waves, TreePine, Square, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockPomodoroTasks, mockAmbientSounds } from "@/lib/mock-data";

const MODES = [
  { label: "Focus", duration: 25 * 60, color: "hsl(248,87%,66%)" },
  { label: "Short Break", duration: 5 * 60, color: "hsl(160,80%,45%)" },
  { label: "Long Break", duration: 15 * 60, color: "hsl(190,90%,50%)" },
];

const soundIcons: Record<string, typeof Coffee> = {
  Coffee: Coffee,
  CloudRain: CloudRain,
  Wind: Wind,
  Music: Music,
  Waves: Waves,
  TreePine: TreePine,
};

export default function Pomodoro() {
  const [modeIdx, setModeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [tasks, setTasks] = useState(mockPomodoroTasks);
  const [newTask, setNewTask] = useState("");
  const [sounds, setSounds] = useState(mockAmbientSounds);
  const [sessionsCompleted, setSessionsCompleted] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mode = MODES[modeIdx];
  const progress = 1 - timeLeft / mode.duration;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (modeIdx === 0) setSessionsCompleted((s) => s + 1);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, modeIdx]);

  const switchMode = (idx: number) => {
    setModeIdx(idx);
    setTimeLeft(MODES[idx].duration);
    setRunning(false);
  };

  const reset = () => {
    setTimeLeft(mode.duration);
    setRunning(false);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: String(Date.now()), text: newTask, done: false }]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const toggleSound = (id: string) => {
    setSounds((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mode tabs */}
      <div className="flex items-center gap-2">
        {MODES.map((m, i) => (
          <button
            key={m.label}
            onClick={() => switchMode(i)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
              modeIdx === i
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground bg-muted/50"
            )}
            style={modeIdx === i ? { background: m.color } : {}}
            data-testid={`mode-tab-${m.label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {m.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn("w-3 h-3 rounded-full border-2", i < sessionsCompleted % 4 ? "border-primary bg-primary" : "border-border")}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 self-center">{sessionsCompleted} sessions</span>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Timer */}
        <div className="md:col-span-3 flex flex-col items-center space-y-6">
          <Card className="border-border/60 w-full">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
              {/* SVG timer ring */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <motion.circle
                    cx="100" cy="100" r="90"
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
                  <div className="text-5xl font-bold font-mono tabular-nums tracking-tight" data-testid="timer-display">
                    {minutes}:{seconds}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">{mode.label}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={reset} data-testid="button-reset-timer">
                  <RotateCcw size={16} />
                </Button>
                <Button
                  className="h-14 w-14 rounded-full text-lg"
                  style={{ background: mode.color }}
                  onClick={() => setRunning((r) => !r)}
                  data-testid="button-toggle-timer"
                >
                  {running ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => switchMode((modeIdx + 1) % MODES.length)} data-testid="button-skip-mode">
                  <ChevronRight size={16} />
                </Button>
              </div>

              {running && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground italic"
                >
                  Stay focused. You're doing great.
                </motion.p>
              )}
            </CardContent>
          </Card>

          {/* Ambient sounds */}
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
                      onClick={() => toggleSound(sound.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs",
                        sound.active
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
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

        {/* Tasks */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-border/60 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                Session Tasks
                <Badge variant="secondary" className="text-[10px]">
                  {tasks.filter(t => t.done).length}/{tasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => (
                <motion.button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2.5 w-full text-left group"
                  whileHover={{ x: 2 }}
                  data-testid={`pomodoro-task-${task.id}`}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 transition-all",
                    task.done ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                  )}>
                    {task.done && <Check size={10} className="text-primary-foreground" />}
                  </div>
                  <span className={cn("text-sm leading-snug", task.done && "line-through text-muted-foreground")}>{task.text}</span>
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
                <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={addTask} data-testid="button-add-task">
                  <Plus size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Focus analytics mini */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Today's Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">4.2<span className="text-base font-normal text-muted-foreground ml-1">hrs</span></div>
              <div className="space-y-1.5">
                {[
                  { label: "Focus sessions", value: `${sessionsCompleted} done`, pct: 75 },
                  { label: "Break time", value: "20 min", pct: 33 },
                  { label: "Weekly goal", value: "84%", pct: 84 },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className="font-medium">{stat.value}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
