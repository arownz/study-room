import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { shortcutModLabel } from "@/lib/platform";
import { FlashcardRichHtml } from "./FlashcardRichHtml";
import type { FlashcardViewModel } from "../hooks/use-flashcards";

interface FlashcardStudySessionProps {
  cards: FlashcardViewModel[];
  startIndex?: number;
  onExit: () => void;
  onComplete: (results: { correct: number; total: number }) => void;
}

export function FlashcardStudySession({
  cards,
  startIndex = 0,
  onExit,
  onComplete,
}: FlashcardStudySessionProps) {
  const [cardIndex, setCardIndex] = useState(
    Math.max(0, Math.min(startIndex, Math.max(cards.length - 1, 0))),
  );
  const [flipped, setFlipped] = useState(false);
  const [grades, setGrades] = useState<(boolean | null)[]>(() => cards.map(() => null));

  const card = cards[cardIndex];
  const modLabel = shortcutModLabel();

  const progress = useMemo(
    () => Math.round(((cardIndex + 1) / Math.max(cards.length, 1)) * 100),
    [cardIndex, cards.length],
  );

  const goPrev = useCallback(() => {
    setFlipped(false);
    setCardIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setFlipped(false);
    setCardIndex((i) => {
      const n = cards.length;
      if (n <= 0) return 0;
      return (i + 1) % n;
    });
  }, [cards.length]);

  useEffect(() => {
    setGrades((prev) => {
      if (cards.length === prev.length) return prev;
      return cards.map((_, idx) => prev[idx] ?? null);
    });
  }, [cards.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case "Space":
          if (document.activeElement instanceof HTMLButtonElement) break;
          e.preventDefault();
          setFlipped((f) => !f);
          break;
        case "ArrowLeft":
          if (!e.repeat) {
            e.preventDefault();
            goPrev();
          }
          break;
        case "ArrowRight":
          if (!e.repeat) {
            e.preventDefault();
            goNext();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const handleAnswer = (correct: boolean) => {
    setFlipped(false);

    const row = [...grades];
    while (row.length < cards.length) row.push(null);
    row[cardIndex] = correct;
    setGrades(row);

    const score = {
      correct: row.filter((v): v is true => v === true).length,
      total: cards.length,
    };

    if (cardIndex + 1 >= cards.length) {
      onComplete(score);
      return;
    }
    setCardIndex((i) => i + 1);
  };

  if (cards.length === 0 || !card) return null;

  const correctCount = grades.filter((v): v is true => v === true).length;
  const missedCount = grades.filter((v) => v === false).length;
  const atFirst = cardIndex === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-flashcard-study-root>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onExit} data-testid="button-back-to-decks">
          <ChevronLeft size={16} /> Back
        </Button>
        <div className="text-sm text-muted-foreground">
          {cardIndex + 1} / {cards.length}
        </div>
        <Badge variant="secondary" className="text-[10px]">
          Study mode
        </Badge>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={atFirst}
          onClick={goPrev}
          className="h-11 w-11 shrink-0 rounded-full"
          title="Previous card"
          aria-label="Previous flashcard"
        >
          <ChevronLeft size={20} />
        </Button>

        <div
          className="relative flex-1 cursor-pointer select-none"
          style={{ perspective: 1200 }}
          role="presentation"
          data-testid="flashcard-flip"
        >
          <motion.div
            className="relative w-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => setFlipped((f) => !f)}
          >
            <Card
              data-role="study-card-front"
              className="flex min-h-[280px] items-center justify-center border-border/60 bg-card p-6 sm:p-8"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="max-h-[340px] w-full overflow-y-auto">
                <div className="mb-4 flex justify-center">
                  <Badge variant="secondary" className="text-[10px]">
                    QUESTION
                  </Badge>
                </div>
                <FlashcardRichHtml
                  html={card.question}
                  centered
                  studyLinkClicks
                  className="text-lg font-medium leading-relaxed"
                />
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Click the card · Space flips · {modLabel}+click opens links · ← → Navigate (→ wraps from last)
                </p>
              </div>
            </Card>
            <Card
              data-role="study-card-back"
              className="absolute inset-0 flex min-h-[280px] items-center justify-center border-primary/30 bg-card p-6 sm:p-8"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="max-h-[340px] w-full overflow-y-auto">
                <div className="mb-4 flex justify-center">
                  <Badge className="bg-primary/20 text-[10px] text-primary">ANSWER</Badge>
                </div>
                <FlashcardRichHtml
                  html={card.answer}
                  centered
                  studyLinkClicks
                  className="text-sm leading-relaxed text-muted-foreground"
                />
              </div>
            </Card>
          </motion.div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goNext}
          className="h-11 w-11 shrink-0 rounded-full"
          title={cards.length <= 1 ? "Only card in deck" : "Next card (wraps from last to first)"}
          aria-label={cards.length <= 1 ? "Next flashcard" : "Next flashcard, wraps from last to first"}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      <AnimatePresence>
        {flipped ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex justify-center gap-3"
          >
            <Button
              variant="outline"
              className="max-w-36 flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              onClick={() => handleAnswer(false)}
              data-testid="button-answer-wrong"
            >
              <X size={16} /> Missed it
            </Button>
            <Button
              className="max-w-36 flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={() => handleAnswer(true)}
              data-testid="button-answer-correct"
            >
              <Check size={16} /> Got it
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check size={11} className="text-emerald-400" /> {correctCount} correct
        </span>
        <span className="flex items-center gap-1">
          <X size={11} className="text-rose-400" /> {missedCount} missed
        </span>
      </div>
    </div>
  );
}


