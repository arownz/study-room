import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  Activity,
  Timer,
  PenLine,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { splitFullName } from "@/features/profile";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateNote,
  useDashboardSummary,
  useListFlashcardDecks,
} from "@workspace/api-client-react";
const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatNoteTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffSec = Math.round((Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(iso).toLocaleDateString();
}

const STREAK_DAYS = 0;
const STREAK_RANK = "Newcomer";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { session, isLoading: isSessionLoading } = useAuth();
  const summaryQuery = useDashboardSummary();
  const decksPreview = useListFlashcardDecks({ limit: 4, offset: 0 });
  const createNote = useCreateNote();
  const [quickTitle, setQuickTitle] = useState("");

  const sessionUser = session?.user;
  const firstName = sessionUser?.name
    ? splitFullName(sessionUser.name).firstName || sessionUser.name
    : "there";

  const s = summaryQuery.data?.data;
  const loading = summaryQuery.isLoading;

  const handleQuickNote = async () => {
    const title = quickTitle.trim() || "Quick note";
    try {
      const res = await createNote.mutateAsync({
        data: { title, content: "" },
      });
      setQuickTitle("");
      setLocation(`/notes/${res.data.id}`);
      toast({ title: "Note created" });
    } catch {
      toast({ title: "Could not create note", variant: "destructive" });
    }
  };

  const firstDeckId = decksPreview.data?.data?.items?.[0]?.id;

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="mx-auto max-w-7xl space-y-6"
    >
      <motion.div variants={fadeUp} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isSessionLoading ? "Welcome back" : `Welcome back, ${firstName}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {STREAK_DAYS > 0
              ? `You're on a ${STREAK_DAYS}-day streak. Keep it going.`
              : "Your overview updates as you add notes, decks, and sessions."}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-semibold">
          <Sparkles size={13} className="text-primary" />
          {STREAK_RANK}
        </Badge>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        <Button size="sm" asChild data-testid="dash-new-session">
          <Link href={firstDeckId ? `/flashcards/deck/${firstDeckId}` : "/flashcards"}>
            <Timer size={14} /> New study session
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/rooms">
            <Users size={14} /> Study rooms
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/pomodoro">
            <Clock size={14} /> Pomodoro
          </Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/ai-tutor">
            <Sparkles size={14} /> AI tutor
          </Link>
        </Button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <PenLine size={15} className="text-primary" />
              Quick note
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Input
              placeholder="Title…"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleQuickNote()}
              className="max-w-md"
              data-testid="dash-quick-note-title"
            />
            <Button
              size="sm"
              onClick={() => void handleQuickNote()}
              disabled={createNote.isPending}
              data-testid="dash-quick-note-create"
            >
              Create & open
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Notes",
            value: s?.notesCount ?? "—",
            icon: BookOpen,
            color: "text-sky-400",
            sub: "Active notes",
          },
          {
            label: "Flashcards",
            value: s?.flashcardsCount ?? "—",
            icon: Layers,
            color: "text-violet-400",
            sub: "Across all decks",
          },
          {
            label: "Decks",
            value: s?.flashcardDecksCount ?? "—",
            icon: TrendingUp,
            color: "text-emerald-400",
            sub: "Flashcard decks",
          },
          {
            label: "Study rooms",
            value: s?.studyRoomsCount ?? "—",
            icon: Users,
            color: "text-amber-400",
            sub: "Rooms you host",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/60 transition-colors hover:border-primary/30"
              data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardContent className="pb-4 pt-5">
                {loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                      <Icon size={16} className={stat.color} />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen size={14} className="text-primary" />
              Recent notes
            </CardTitle>
            <Link
              href="/notes"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              data-testid="link-all-notes"
            >
              All <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (s?.recentNotes.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet. Create one above.</p>
            ) : (
              s!.recentNotes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`}>
                  <div
                    className="-mx-2 flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                    data-testid={`note-item-${note.id}`}
                  >
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{formatNoteTime(note.updatedAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers size={14} className="text-primary" />
              Deck preview
            </CardTitle>
            <Link
              href="/flashcards"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              data-testid="link-all-flashcards"
            >
              All decks <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {decksPreview.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (decksPreview.data?.data.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No decks yet. Create a deck to organize flashcards.
              </p>
            ) : (
              decksPreview.data!.data.items.map((deck) => (
                <div key={deck.id} className="space-y-2" data-testid={`deck-preview-${deck.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/flashcards/deck/${deck.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {deck.title}
                    </Link>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    {deck.description?.trim()
                      ? deck.description.trim().slice(0, 100)
                      : "Open to add cards and study"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border-border/60 bg-primary/5">
          <CardContent className="flex flex-col gap-4 pt-4 pb-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">AI & focus</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Open the AI tutor for explanations and quizzes. Pomodoro sessions completed (all time):{" "}
                <span className="font-medium text-foreground">
                  {s?.pomodoroSessionsCompletedTotal ?? 0}
                </span>
                .
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/ai-tutor">AI tutor</Link>
              </Button>
              <Button size="sm" asChild data-testid="button-ai-recommendation">
                <Link href="/flashcards">Flashcards</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border-dashed border-border/60">
          <CardContent className="flex items-start gap-3 py-4">
            <Activity size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Charts & deep analytics</p>
              <p className="text-xs text-muted-foreground">
                Weekly hours and subject breakdown will connect here when the analytics module ships.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
