import { motion } from "framer-motion";
import { ArrowRight, Clock3, Layers3, PencilLine, Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useGetFlashcardDeckStats } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import type { FlashcardDeckViewModel } from "../hooks/use-flashcard-decks";
import { HoverTooltip } from "@/components/ui/hover-tooltip";

interface FlashcardDeckBrowseProps {
  decks: FlashcardDeckViewModel[];
  isLoading: boolean;
  isError: boolean;
  onCreateDeck: () => void;
  onDeleteDeck: (deck: FlashcardDeckViewModel) => void;
  deletingDeckId?: string | null;
}

function getDeckTag(cardCount: number): { label: string; className: string } {
  if (cardCount >= 60) {
    return {
      label: "Dense",
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    };
  }
  if (cardCount >= 25) {
    return {
      label: "Active",
      className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    };
  }
  return {
    label: "Fresh",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  };
}

function FlashcardDeckCard({
  deck,
  onDeleteDeck,
  deletingDeckId,
}: Pick<FlashcardDeckBrowseProps, "onDeleteDeck" | "deletingDeckId"> & { deck: FlashcardDeckViewModel }) {
  const statsQuery = useGetFlashcardDeckStats(deck.id);
  const cardCount = statsQuery.data?.data.cardCount ?? 0;
  const dueCount = 0;
  const masteryPct = 0;
  const deckTag = getDeckTag(cardCount);

  return (
    <motion.div
      key={deck.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card
        className="group h-full overflow-hidden rounded-2xl border-border/60 bg-card/90 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] transition-all hover:border-primary/25"
        data-testid={`flashcard-deck-card-${deck.id}`}
      >
        <div className="h-[3px] bg-linear-to-r from-violet-500/80 via-fuchsia-500/80 to-cyan-400/80" />
        <CardHeader className="space-y-0 p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link href={`/flashcards/deck/${deck.id}`} className="block min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {deck.title}
                </h3>
              </Link>
              <p className="text-[11px] text-muted-foreground">
                {deck.description?.trim() || "Open the deck to add cards and start a study run."}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={deckTag.className}>
                {deckTag.label}
              </Badge>
              <HoverTooltip content="Delete deck">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive/70 hover:text-destructive"
                  onClick={() => onDeleteDeck(deck)}
                  disabled={deletingDeckId === deck.id}
                  data-testid={`button-delete-deck-${deck.id}`}
                >
                  {deletingDeckId === deck.id ? <Spinner className="size-3" /> : <Trash2 size={13} />}
                </Button>
              </HoverTooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 pt-0">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Mastery</span>
              <span className="font-medium text-foreground">{masteryPct}%</span>
            </div>
            <Progress value={masteryPct} className="h-1.5 bg-white/8 [&>div]:bg-primary" />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Layers3 size={11} />
                {cardCount} cards
              </span>
              <span>0 mastered</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
              <Clock3 size={11} />
              {dueCount} due
            </span>
            <span className="truncate">Updated {deck.relativeUpdatedAt}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="h-9 flex-1 rounded-xl bg-primary/90 text-primary-foreground shadow-sm transition-transform active:translate-y-px"
              data-testid={`button-study-deck-${deck.id}`}
            >
              <Link href={`/flashcards/deck/${deck.id}`}>
                <Play size={13} />
                <span className="ml-1.5">Study Now</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-9 rounded-xl border border-border/60 px-3 hover:bg-muted/60"
              data-testid={`button-edit-deck-${deck.id}`}
            >
              <Link href={`/flashcards/deck/${deck.id}`}>
                <PencilLine size={13} />
                <span className="ml-1.5">Edit</span>
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Sparkles size={11} />
              Review tracking coming next
            </span>
            <ArrowRight size={11} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function FlashcardDeckBrowse({
  decks,
  isLoading,
  isError,
  onCreateDeck,
  onDeleteDeck,
  deletingDeckId,
}: FlashcardDeckBrowseProps) {
  if (isLoading && decks.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Couldn&apos;t load decks</EmptyTitle>
          <EmptyDescription>Refresh the page to try again.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (decks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Create your first deck</EmptyTitle>
          <EmptyDescription>
            Decks organize your flashcards. Add a deck, then add cards and start a study session.
          </EmptyDescription>
        </EmptyHeader>
        <Button size="sm" onClick={onCreateDeck} className="mt-2" data-testid="button-first-deck">
          <Plus size={14} /> New deck
        </Button>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
      {decks.map((deck) => (
        <FlashcardDeckCard
          key={deck.id}
          deck={deck}
          onDeleteDeck={onDeleteDeck}
          deletingDeckId={deletingDeckId}
        />
      ))}
    </div>
  );
}
