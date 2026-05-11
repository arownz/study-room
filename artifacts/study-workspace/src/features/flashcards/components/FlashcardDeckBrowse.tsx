import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import type { FlashcardDeckViewModel } from "../hooks/use-flashcard-decks";

interface FlashcardDeckBrowseProps {
  decks: FlashcardDeckViewModel[];
  isLoading: boolean;
  isError: boolean;
  onCreateDeck: () => void;
}

export function FlashcardDeckBrowse({
  decks,
  isLoading,
  isError,
  onCreateDeck,
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <motion.div
          key={deck.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Link href={`/flashcards/deck/${deck.id}`}>
            <Card
              className="h-full cursor-pointer border-border/60 transition-colors hover:border-primary/30"
              data-testid={`flashcard-deck-card-${deck.id}`}
            >
              <div className="h-1 bg-gradient-to-r from-violet-500/70 to-primary" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{deck.title}</h3>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    <Layers size={10} className="mr-0.5" />
                    Deck
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {deck.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{deck.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Open to add cards and study</p>
                )}
                <p className="text-[10px] text-muted-foreground">Updated {deck.relativeUpdatedAt}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
