import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListStudyRoomsQueryKey,
  useCreateStudyRoom,
  useDeleteStudyRoom,
  useListStudyRooms,
  useUpdateStudyRoom,
  type StudyRoom,
} from "@workspace/api-client-react";

export interface StudyRoomViewModel extends StudyRoom {
  relativeUpdatedAt: string;
  ownerInitials: string;
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

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "RM";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function useStudyRooms() {
  const queryClient = useQueryClient();
  const roomsQuery = useListStudyRooms({ limit: 100, offset: 0 });
  const createMutation = useCreateStudyRoom();
  const updateMutation = useUpdateStudyRoom();
  const deleteMutation = useDeleteStudyRoom();

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: getListStudyRoomsQueryKey() }),
    [queryClient],
  );

  const rooms: StudyRoomViewModel[] = useMemo(() => {
    const items = roomsQuery.data?.data?.items ?? [];
    return items.map((room) => ({
      ...room,
      relativeUpdatedAt: formatRelative(room.updatedAt),
      ownerInitials: deriveInitials(room.name),
    }));
  }, [roomsQuery.data]);

  const createRoom = useCallback(
    async (input: { name: string; description?: string; isPublic?: boolean }) => {
      const result = await createMutation.mutateAsync({
        data: {
          name: input.name,
          description: input.description ?? "",
          isPublic: input.isPublic ?? false,
        },
      });
      await refresh();
      return result.data;
    },
    [createMutation, refresh],
  );

  const updateRoom = useCallback(
    async (
      roomId: string,
      input: { name?: string; description?: string | null; isPublic?: boolean },
    ) => {
      const data = {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      };
      const result = await updateMutation.mutateAsync({ roomId, data });
      await refresh();
      return result.data;
    },
    [updateMutation, refresh],
  );

  const deleteRoom = useCallback(
    async (roomId: string) => {
      await deleteMutation.mutateAsync({ roomId });
      await refresh();
    },
    [deleteMutation, refresh],
  );

  return {
    rooms,
    isLoading: roomsQuery.isLoading,
    isError: roomsQuery.isError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createRoom,
    updateRoom,
    deleteRoom,
  };
}
