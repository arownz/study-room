import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Play, ChevronLeft, ChevronRight, Check, X, RotateCcw, Layers, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { mockFlashcardDecks, mockFlashcards } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

type Deck = typeof mockFlashcardDecks[number];

const difficultyColor: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-400/10",
  Medium: "text-amber-400 bg-amber-400/10",
  Hard: "text-rose-400 bg-rose-400/10",
};

export default function Flashcards() {
  const [mode, setMode] = useState<"decks" | "study">("decks");
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const { toast } = useToast();

  const card = mockFlashcards[cardIndex % mockFlashcards.length];

  const startStudy = (deck: Deck) => {
    setActiveDeck(deck);
    setCardIndex(0);
    setFlipped(false);
    setResults([]);
    setMode("study");
  };

  const handleAnswer = (correct: boolean) => {
    setResults((prev) => [...prev, correct]);
    setFlipped(false);
    if (cardIndex + 1 >= mockFlashcards.length) {
      const score = [...results, correct].filter(Boolean).length;
      toast({ title: "Session complete!", description: `${score}/${mockFlashcards.length} correct` });
      setMode("decks");
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  if (mode === "study" && activeDeck) {
    const progress = Math.round(((cardIndex) / mockFlashcards.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setMode("decks")} data-testid="button-back-to-decks">
            <ChevronLeft size={16} /> Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {cardIndex + 1} / {mockFlashcards.length}
          </div>
          <Badge className={difficultyColor[card.difficulty]}>
            {card.difficulty}
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
            {/* Front */}
            <Card className="border-border/60 min-h-[280px] flex items-center justify-center p-8 bg-card" style={{ backfaceVisibility: "hidden" }}>
              <div className="text-center space-y-3">
                <Badge variant="secondary" className="text-[10px]">QUESTION</Badge>
                <p className="text-lg font-medium leading-relaxed">{card.front}</p>
                <p className="text-xs text-muted-foreground mt-4">Click to reveal answer</p>
              </div>
            </Card>

            {/* Back */}
            <Card
              className="absolute inset-0 border-primary/30 min-h-[280px] flex items-center justify-center p-8 bg-card"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="text-center space-y-3">
                <Badge className="text-[10px] bg-primary/20 text-primary">ANSWER</Badge>
                <p className="text-sm leading-relaxed text-muted-foreground">{card.back}</p>
              </div>
            </Card>
          </motion.div>
        </div>

        <AnimatePresence>
          {flipped && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex gap-3 justify-center"
            >
              <Button
                variant="outline"
                className="flex-1 max-w-36 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => handleAnswer(false)}
                data-testid="button-answer-wrong"
              >
                <X size={16} /> Missed it
              </Button>
              <Button
                className="flex-1 max-w-36 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => handleAnswer(true)}
                data-testid="button-answer-correct"
              >
                <Check size={16} /> Got it
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Check size={11} className="text-emerald-400" /> {results.filter(Boolean).length} correct</span>
          <span className="flex items-center gap-1"><X size={11} className="text-rose-400" /> {results.filter(b => !b).length} missed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Flashcard Decks</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{mockFlashcardDecks.reduce((a, d) => a + d.due, 0)} cards due for review today</p>
        </div>
        <Button size="sm" data-testid="button-new-deck">
          <Plus size={14} /> New Deck
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {mockFlashcardDecks.map((deck) => {
          const pct = Math.round((deck.mastered / deck.cardCount) * 100);
          return (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-border/60 hover:border-primary/30 transition-colors overflow-hidden" data-testid={`deck-card-${deck.id}`}>
                <div className="h-1" style={{ background: deck.color }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">{deck.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{deck.subject}</p>
                    </div>
                    <Badge className={cn("text-[10px]", difficultyColor[deck.difficulty])}>
                      {deck.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Mastery</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers size={11} /> {deck.cardCount} cards</span>
                    <span className="flex items-center gap-1"><TrendingUp size={11} /> {deck.mastered} mastered</span>
                    <Badge variant="outline" className="text-[10px] py-0 border-amber-500/30 text-amber-400">{deck.due} due</Badge>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={() => startStudy(deck)} data-testid={`button-study-deck-${deck.id}`}>
                      <Play size={13} /> Study Now
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-edit-deck-${deck.id}`}>
                      Edit
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right flex items-center justify-end gap-1">
                    <RotateCcw size={9} /> {deck.lastStudied}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
