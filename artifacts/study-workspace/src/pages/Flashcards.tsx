import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FlashcardCreateDialog } from "@/features/flashcards/components/FlashcardCreateDialog";
import { FlashcardDeckGrid } from "@/features/flashcards/components/FlashcardDeckGrid";
import { FlashcardEditor } from "@/features/flashcards/components/FlashcardEditor";
import { FlashcardStudySession } from "@/features/flashcards/components/FlashcardStudySession";
import {
  useFlashcards,
  type FlashcardViewModel,
} from "@/features/flashcards/hooks/use-flashcards";

export default function Flashcards() {
  const { toast } = useToast();
  const {
    cards,
    isLoading,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    createCard,
    updateCard,
    deleteCard,
  } = useFlashcards();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FlashcardViewModel | null>(null);
  const [studyState, setStudyState] = useState<{ startId: string } | null>(null);

  const handleCreate = async (values: { question: string; answer: string }) => {
    try {
      await createCard(values);
      setCreateOpen(false);
      toast({ title: "Flashcard created" });
    } catch {
      toast({ title: "Failed to create flashcard", variant: "destructive" });
    }
  };

  const handleSave = async (values: { question: string; answer: string }) => {
    if (!editing) return;
    try {
      await updateCard(editing.id, values);
      setEditing(null);
      toast({ title: "Flashcard saved" });
    } catch {
      toast({ title: "Failed to save flashcard", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await deleteCard(editing.id);
      setEditing(null);
      toast({ title: "Flashcard deleted" });
    } catch {
      toast({ title: "Failed to delete flashcard", variant: "destructive" });
    }
  };

  if (studyState) {
    const startIndex = Math.max(
      0,
      cards.findIndex((card) => card.id === studyState.startId),
    );
    return (
      <FlashcardStudySession
        cards={cards}
        startIndex={startIndex}
        onExit={() => setStudyState(null)}
        onComplete={({ correct, total }) => {
          toast({
            title: "Session complete",
            description: `${correct}/${total} correct`,
          });
          setStudyState(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Flashcards</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cards.length} card{cards.length === 1 ? "" : "s"} in your collection
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-new-flashcard">
          <Plus size={14} /> New card
        </Button>
      </div>

      <FlashcardDeckGrid
        cards={cards}
        isLoading={isLoading}
        isError={isError}
        onStudy={(card) => setStudyState({ startId: card.id })}
        onEdit={(card) => setEditing(card)}
      />

      <FlashcardCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />

      <FlashcardEditor
        card={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
}
