import { useCallback, useMemo } from "react";
import {
  useCreateWhiteboard,
  useDeleteWhiteboard,
  useListWhiteboards,
  useUpdateWhiteboard,
  type WhiteboardRecord,
} from "@workspace/api-client-react";

export interface WhiteboardViewModel extends WhiteboardRecord {
  relativeUpdatedAt: string;
}

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffSeconds = Math.round((Date.now() - ts) / 1000);
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function useWhiteboards() {
  const boardsQuery = useListWhiteboards({ limit: 100, offset: 0 });
  const createMutation = useCreateWhiteboard();
  const updateMutation = useUpdateWhiteboard();
  const deleteMutation = useDeleteWhiteboard();

  const boards = useMemo<WhiteboardViewModel[]>(() => {
    const items = boardsQuery.data?.data?.items ?? [];
    return items.map((board) => ({
      ...board,
      relativeUpdatedAt: formatRelativeTime(board.updatedAt),
    }));
  }, [boardsQuery.data]);

  const createBoard = useCallback(
    async (input?: { title?: string }) => {
      const result = await createMutation.mutateAsync({ title: input?.title });
      return result.data;
    },
    [createMutation],
  );

  const updateBoard = useCallback(
    async (whiteboardId: string, data: { title?: string; snapshot?: string }) => {
      const result = await updateMutation.mutateAsync({ whiteboardId, data });
      return result.data;
    },
    [updateMutation],
  );

  const deleteBoard = useCallback(
    async (whiteboardId: string) => {
      await deleteMutation.mutateAsync({ whiteboardId });
    },
    [deleteMutation],
  );

  return {
    boards,
    isLoading: boardsQuery.isLoading,
    isError: boardsQuery.isError,
    isCreating: createMutation.isPending,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}
