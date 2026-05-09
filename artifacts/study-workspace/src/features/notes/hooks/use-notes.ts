import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListNotesQueryKey,
  useCreateNote,
  useDeleteNote,
  useListNotes,
  useUpdateNote,
} from "@workspace/api-client-react";
import { buildNoteViewModel, type NoteViewModel } from "../types";

const FAVORITES_STORAGE_KEY = "studyroom:favorite-notes";

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    // ignore corrupted storage
  }
  return new Set();
}

function persistFavorites(values: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...values]));
}

export function useNotes() {
  const queryClient = useQueryClient();
  const notesQuery = useListNotes({ limit: 100, offset: 0 });
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  const [favorites, setFavorites] = useState<Set<string>>(() => readFavorites());

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() }),
    [queryClient],
  );

  useEffect(() => {
    persistFavorites(favorites);
  }, [favorites]);

  const notes: NoteViewModel[] = useMemo(() => {
    const items = notesQuery.data?.data?.items ?? [];
    return items.map((note) => buildNoteViewModel(note, favorites.has(note.id)));
  }, [notesQuery.data, favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const createNote = useCallback(
    async (input?: { title?: string; content?: string }) => {
      const result = await createNoteMutation.mutateAsync({
        data: {
          title: input?.title?.trim() || "Untitled Note",
          content: input?.content ?? "",
        },
      });
      await refresh();
      return result.data;
    },
    [createNoteMutation, refresh],
  );

  const updateNote = useCallback(
    async (noteId: string, payload: { title?: string; content?: string }) => {
      const data = {
        ...(payload.title !== undefined ? { title: payload.title.trim() || "Untitled Note" } : {}),
        ...(payload.content !== undefined ? { content: payload.content } : {}),
      };
      const result = await updateNoteMutation.mutateAsync({ noteId, data });
      await refresh();
      return result.data;
    },
    [updateNoteMutation, refresh],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      await deleteNoteMutation.mutateAsync({ noteId });
      setFavorites((prev) => {
        if (!prev.has(noteId)) return prev;
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      await refresh();
    },
    [deleteNoteMutation, refresh],
  );

  return {
    notes,
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
    isSaving: updateNoteMutation.isPending || createNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    toggleFavorite,
    createNote,
    updateNote,
    deleteNote,
  };
}

export type UseNotesReturn = ReturnType<typeof useNotes>;
