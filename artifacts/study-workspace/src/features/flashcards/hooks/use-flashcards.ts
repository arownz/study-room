import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListFlashcardsQueryKey,
  useCreateFlashcard,
  useDeleteFlashcard,
  useListFlashcards,
  useUpdateFlashcard,
  type Flashcard,
} from "@workspace/api-client-react";

export interface FlashcardViewModel extends Flashcard {
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

export function useFlashcards() {
  const queryClient = useQueryClient();
  const cardsQuery = useListFlashcards({ limit: 100, offset: 0 });
  const createMutation = useCreateFlashcard();
  const updateMutation = useUpdateFlashcard();
  const deleteMutation = useDeleteFlashcard();

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: getListFlashcardsQueryKey() }),
    [queryClient],
  );

  const cards: FlashcardViewModel[] = useMemo(() => {
    const items = cardsQuery.data?.data?.items ?? [];
    return items.map((card) => ({
      ...card,
      relativeUpdatedAt: formatRelative(card.updatedAt),
    }));
  }, [cardsQuery.data]);

  const createCard = useCallback(
    async (input: { question: string; answer: string }) => {
      const result = await createMutation.mutateAsync({ data: input });
      await refresh();
      return result.data;
    },
    [createMutation, refresh],
  );

  const updateCard = useCallback(
    async (flashcardId: string, input: { question?: string; answer?: string }) => {
      const data = {
        ...(input.question !== undefined ? { question: input.question } : {}),
        ...(input.answer !== undefined ? { answer: input.answer } : {}),
      };
      const result = await updateMutation.mutateAsync({ flashcardId, data });
      await refresh();
      return result.data;
    },
    [updateMutation, refresh],
  );

  const deleteCard = useCallback(
    async (flashcardId: string) => {
      await deleteMutation.mutateAsync({ flashcardId });
      await refresh();
    },
    [deleteMutation, refresh],
  );

  return {
    cards,
    isLoading: cardsQuery.isLoading,
    isError: cardsQuery.isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createCard,
    updateCard,
    deleteCard,
  };
}
