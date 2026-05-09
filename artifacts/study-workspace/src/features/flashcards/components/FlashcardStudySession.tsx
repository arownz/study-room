import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const [cardIndex, setCardIndex] = useState(Math.max(0, Math.min(startIndex, cards.length - 1)));
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const card = cards[cardIndex];
  const progress = useMemo(
    () => Math.round((cardIndex / Math.max(cards.length, 1)) * 100),
    [cardIndex, cards.length],
  );

  if (!card) return null;

  const handleAnswer = (correct: boolean) => {
    const next = [...results, correct];
    setResults(next);
    setFlipped(false);
    if (cardIndex + 1 >= cards.length) {
      onComplete({ correct: next.filter(Boolean).length, total: cards.length });
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
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

      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: 1200 }}
        onClick={() => setFlipped((f) => !f)}
        data-testid="flashcard-flip"
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card
            className="flex min-h-[280px] items-center justify-center border-border/60 bg-card p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="space-y-3 text-center">
              <Badge variant="secondary" className="text-[10px]">
                QUESTION
              </Badge>
              <p className="text-lg font-medium leading-relaxed">{card.question}</p>
              <p className="mt-4 text-xs text-muted-foreground">Click to reveal answer</p>
            </div>
          </Card>
          <Card
            className="absolute inset-0 flex min-h-[280px] items-center justify-center border-primary/30 bg-card p-8"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="space-y-3 text-center">
              <Badge className="bg-primary/20 text-[10px] text-primary">ANSWER</Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">{card.answer}</p>
            </div>
          </Card>
        </motion.div>
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
          <Check size={11} className="text-emerald-400" /> {results.filter(Boolean).length} correct
        </span>
        <span className="flex items-center gap-1">
          <X size={11} className="text-rose-400" /> {results.filter((b) => !b).length} missed
        </span>
      </div>
    </div>
  );
}
