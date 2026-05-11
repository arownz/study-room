import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListFlashcardDecksQueryKey,
  useCreateFlashcardDeck,
  useDeleteFlashcardDeck,
  useListFlashcardDecks,
  useUpdateFlashcardDeck,
  type FlashcardDeck,
} from "@workspace/api-client-react";

export interface FlashcardDeckViewModel extends FlashcardDeck {
  relativeUpdatedAt: string;
}

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

export function useFlashcardDecks() {
  const queryClient = useQueryClient();
  const decksQuery = useListFlashcardDecks({ limit: 100, offset: 0 });
  const createMutation = useCreateFlashcardDeck();
  const updateMutation = useUpdateFlashcardDeck();
  const deleteMutation = useDeleteFlashcardDeck();

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: getListFlashcardDecksQueryKey() });
    void queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === "/api/v1/flashcard-decks",
    });
  }, [queryClient]);

  const decks: FlashcardDeckViewModel[] = (decksQuery.data?.data?.items ?? []).map((d) => ({
    ...d,
    relativeUpdatedAt: formatRelative(d.updatedAt),
  }));

  const createDeck = useCallback(
    async (input: { title: string; description?: string | null }) => {
      const result = await createMutation.mutateAsync({ data: input });
      await refresh();
      return result.data;
    },
    [createMutation, refresh],
  );

  const updateDeck = useCallback(
    async (deckId: string, input: { title?: string; description?: string | null }) => {
      const result = await updateMutation.mutateAsync({ deckId, data: input });
      await refresh();
      return result.data;
    },
    [updateMutation, refresh],
  );

  const deleteDeck = useCallback(
    async (deckId: string) => {
      await deleteMutation.mutateAsync({ deckId });
      await refresh();
    },
    [deleteMutation, refresh],
  );

  return {
    decks,
    isLoading: decksQuery.isLoading,
    isError: decksQuery.isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createDeck,
    updateDeck,
    deleteDeck,
    refresh,
  };
}
