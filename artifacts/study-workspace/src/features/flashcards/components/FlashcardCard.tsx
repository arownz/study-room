import { motion } from "framer-motion";
import { Pencil, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FlashcardRichHtml } from "./FlashcardRichHtml";
import type { FlashcardViewModel } from "../hooks/use-flashcards";

interface FlashcardCardProps {
  card: FlashcardViewModel;
  onStudy: (card: FlashcardViewModel) => void;
  onEdit: (card: FlashcardViewModel) => void;
}

export function FlashcardCard({ card, onStudy, onEdit }: FlashcardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className="overflow-hidden border-border/60 transition-colors hover:border-primary/30"
        data-testid={`flashcard-card-${card.id}`}
      >
        <div className="h-1 bg-gradient-to-r from-primary/60 to-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-h-[2.5rem] flex-1 text-sm font-semibold leading-snug tracking-tight">
              <FlashcardRichHtml html={card.question} lineClamp={2} studyLinkClicks />
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Card
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <FlashcardRichHtml
            html={card.answer}
            lineClamp={3}
            studyLinkClicks
            className="text-xs text-muted-foreground"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Updated {card.relativeUpdatedAt}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onStudy(card)}
              data-testid={`button-study-${card.id}`}
            >
              <Play size={13} /> Study
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(card)}
              data-testid={`button-edit-${card.id}`}
            >
              <Pencil size={13} /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
