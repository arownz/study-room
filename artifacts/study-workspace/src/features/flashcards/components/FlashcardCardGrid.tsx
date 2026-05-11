import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { FlashcardCard } from "./FlashcardCard";
import type { FlashcardViewModel } from "../hooks/use-flashcards";

interface FlashcardCardGridProps {
  cards: FlashcardViewModel[];
  isLoading: boolean;
  isError: boolean;
  onStudy: (card: FlashcardViewModel) => void;
  onEdit: (card: FlashcardViewModel) => void;
}

export function FlashcardCardGrid({
  cards,
  isLoading,
  isError,
  onStudy,
  onEdit,
}: FlashcardCardGridProps) {
  if (isLoading && cards.length === 0) {
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
          <EmptyTitle>Couldn&apos;t load flashcards</EmptyTitle>
          <EmptyDescription>Refresh the page to try again.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (cards.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No cards in this deck</EmptyTitle>
          <EmptyDescription>Add a card to start studying this deck.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <FlashcardCard key={card.id} card={card} onStudy={onStudy} onEdit={onEdit} />
      ))}
    </div>
  );
}
