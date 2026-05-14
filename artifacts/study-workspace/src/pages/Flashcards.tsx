import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { FlashcardCardGrid } from "@/features/flashcards/components/FlashcardCardGrid";
import { FlashcardCreateDialog } from "@/features/flashcards/components/FlashcardCreateDialog";
import { FlashcardDeckBrowse } from "@/features/flashcards/components/FlashcardDeckBrowse";
import { FlashcardDeckCreateDialog } from "@/features/flashcards/components/FlashcardDeckCreateDialog";
import { FlashcardEditor } from "@/features/flashcards/components/FlashcardEditor";
import { FlashcardStudySession } from "@/features/flashcards/components/FlashcardStudySession";
import { useFlashcardDecks } from "@/features/flashcards/hooks/use-flashcard-decks";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import {
  useFlashcards,
  type FlashcardViewModel,
} from "@/features/flashcards/hooks/use-flashcards";
import {
  getGetFlashcardByIdQueryKey,
  getGetFlashcardDeckByIdQueryKey,
  useGetFlashcardById,
  useGetFlashcardDeckById,
} from "@workspace/api-client-react";

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffSec = Math.round((Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Flashcards() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deckRoute, deckParams] = useRoute<{ deckId: string }>("/flashcards/deck/:deckId");
  const [cardRoute, cardParams] = useRoute<{ flashcardId: string }>(
    "/flashcards/card/:flashcardId",
  );

  const routeDeckId = deckRoute && deckParams ? deckParams.deckId : undefined;
  const routeCardId = cardRoute && cardParams ? cardParams.flashcardId : undefined;

  const {
    decks,
    isLoading: decksLoading,
    isError: decksError,
    isCreating: deckCreating,
    isDeleting: deckDeleting,
    createDeck,
    deleteDeck,
  } = useFlashcardDecks();

  const {
    cards,
    isLoading: cardsLoading,
    isError: cardsError,
    isCreating,
    isUpdating,
    isDeleting,
    createCard,
    updateCard,
    deleteCard,
  } = useFlashcards(routeDeckId);

  const cardDetailQuery = useGetFlashcardById(routeCardId ?? "", {
    query: {
      queryKey: getGetFlashcardByIdQueryKey(routeCardId ?? ""),
      enabled: Boolean(routeCardId),
    },
  });

  const deckMetaQuery = useGetFlashcardDeckById(routeDeckId ?? "", {
    query: {
      queryKey: getGetFlashcardDeckByIdQueryKey(routeDeckId ?? ""),
      enabled: Boolean(routeDeckId),
    },
  });

  const [deckCreateOpen, setDeckCreateOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FlashcardViewModel | null>(null);
  const [studyState, setStudyState] = useState<{ startId: string } | null>(null);
  const [confirmDeleteDeckId, setConfirmDeleteDeckId] = useState<string | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (!routeCardId || !cardDetailQuery.data?.data) return;
    const c = cardDetailQuery.data.data;
    setEditing({
      ...c,
      relativeUpdatedAt: formatRelative(c.updatedAt),
    });
  }, [routeCardId, cardDetailQuery.data]);

  const handleCreateDeck = async (values: { title: string; description: string | null }) => {
    try {
      const created = await createDeck(values);
      setDeckCreateOpen(false);
      setLocation(`/flashcards/deck/${created.id}`);
      toast({ title: "Deck created" });
    } catch {
      toast({ title: "Failed to create deck", variant: "destructive" });
    }
  };

  const handleDeleteDeck = async (deck: { id: string; title: string }) => {
    setConfirmDeleteDeckId(deck.id);
  };

  const deleteDeckNow = async (deck: { id: string; title: string }) => {
    setDeletingDeckId(deck.id);
    try {
      await deleteDeck(deck.id);
      if (routeDeckId === deck.id) {
        setLocation("/flashcards");
      }
      toast({ title: "Deck deleted" });
    } catch {
      toast({ title: "Failed to delete deck", variant: "destructive" });
    } finally {
      setDeletingDeckId(null);
    }
  };

  const deleteDeckTarget = decks.find((deck) => deck.id === confirmDeleteDeckId) ?? null;

  const handleCreateCard = async (values: { question: string; answer: string }) => {
    if (!routeDeckId) return;
    try {
      await createCard({ deckId: routeDeckId, ...values });
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
      if (routeCardId) {
        setLocation(
          editing.deckId ? `/flashcards/deck/${editing.deckId}` : "/flashcards",
        );
      }
      toast({ title: "Flashcard saved" });
    } catch {
      toast({ title: "Failed to save flashcard", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      const d = editing.deckId;
      await deleteCard(editing.id);
      setEditing(null);
      if (routeCardId) {
        setLocation(d ? `/flashcards/deck/${d}` : "/flashcards");
      }
      toast({ title: "Flashcard deleted" });
    } catch {
      toast({ title: "Failed to delete flashcard", variant: "destructive" });
    }
  };

  const closeEditor = (open: boolean) => {
    if (!open) {
      const fallbackDeck = editing?.deckId;
      setEditing(null);
      if (routeCardId) {
        setLocation(
          fallbackDeck
            ? `/flashcards/deck/${fallbackDeck}`
            : routeDeckId
              ? `/flashcards/deck/${routeDeckId}`
              : "/flashcards",
        );
      }
    }
  };

  if (studyState && routeDeckId) {
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

  if (routeDeckId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/flashcards">
                <ChevronLeft size={16} />
                Decks
              </Link>
            </Button>
            <div>
              <h2 className="text-xl font-bold">
                {deckMetaQuery.data?.data.title ?? "Deck"}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {cards.length} card{cards.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            disabled={!routeDeckId}
            data-testid="button-new-flashcard"
          >
            <Plus size={14} /> New card
          </Button>
        </div>

        <FlashcardCardGrid
          cards={cards}
          isLoading={cardsLoading}
          isError={cardsError}
          onStudy={(card) => setStudyState({ startId: card.id })}
          onEdit={(card) => setEditing(card)}
        />

        <FlashcardCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreateCard}
          isSubmitting={isCreating}
        />

        <FlashcardEditor
          card={editing}
          open={editing !== null}
          onOpenChange={closeEditor}
          onSave={handleSave}
          onDelete={handleDelete}
          isSaving={isUpdating}
          isDeleting={isDeleting}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Flashcard decks</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {decks.length} deck{decks.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setDeckCreateOpen(true)}
          data-testid="button-new-deck"
          disabled={decksLoading}
        >
          <Plus size={14} /> New deck
        </Button>
      </div>

      <FlashcardDeckBrowse
        decks={decks}
        isLoading={decksLoading}
        isError={decksError}
        onCreateDeck={() => setDeckCreateOpen(true)}
        onDeleteDeck={(deck) => void handleDeleteDeck(deck)}
        deletingDeckId={deckDeleting ? deletingDeckId : null}
      />

      <FlashcardDeckCreateDialog
        open={deckCreateOpen}
        onOpenChange={setDeckCreateOpen}
        onSubmit={handleCreateDeck}
        isSubmitting={deckCreating}
      />

      <FlashcardEditor
        card={editing}
        open={editing !== null && !routeDeckId}
        onOpenChange={closeEditor}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isUpdating}
        isDeleting={isDeleting}
      />

      <ConfirmDialog
        open={confirmDeleteDeckId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteDeckId(null);
        }}
        title="Delete this deck?"
        description={`Delete "${deleteDeckTarget?.title ?? "Untitled Deck"}" and all of its flashcards?`}
        confirmLabel={deckDeleting ? "Deleting…" : "Delete deck"}
        confirmDisabled={deckDeleting}
        cancelDisabled={deckDeleting}
        confirmVariant="destructive"
        onConfirm={async (event) => {
          event.preventDefault();
          if (!deleteDeckTarget) return;
          setConfirmDeleteDeckId(null);
          await deleteDeckNow(deleteDeckTarget);
        }}
      />
    </div>
  );
}
