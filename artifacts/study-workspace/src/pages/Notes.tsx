import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { NoteEditor } from "@/features/notes/components/NoteEditor";
import { NoteList } from "@/features/notes/components/NoteList";
import { NotesFolderSidebar } from "@/features/notes/components/NotesFolderSidebar";
import { useNotes } from "@/features/notes/hooks/use-notes";
import type { NotesFilter } from "@/features/notes/types";
import { htmlToPlainText } from "@/components/rich-editor/RichTextEditor";

const LAST_NOTE_ID_KEY = "studyroom.notes.lastNoteId";

export default function Notes() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [routeMatch, routeParams] = useRoute<{ noteId: string }>("/notes/:noteId");
  // wouter recreates routeParams every render; pin to a primitive string for effect deps.
  const routeNoteId = routeMatch && routeParams ? routeParams.noteId : null;

  const {
    notes,
    isLoading,
    isError,
    isSaving,
    isDeleting,
    toggleFavorite,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  const [filter, setFilter] = useState<NotesFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(routeNoteId ?? "");
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [selectedNoteDirty, setSelectedNoteDirty] = useState(false);
  const attemptedLastNoteRestore = useRef(false);

  useEffect(() => {
    if (routeNoteId) setSelectedId(routeNoteId);
  }, [routeNoteId]);

  useEffect(() => {
    if (routeNoteId) {
      try {
        sessionStorage.setItem(LAST_NOTE_ID_KEY, routeNoteId);
      } catch {
        /* ignore quota / private mode */
      }
      return;
    }
    if (attemptedLastNoteRestore.current || isLoading || isError) return;
    let last: string | null = null;
    try {
      last = sessionStorage.getItem(LAST_NOTE_ID_KEY);
    } catch {
      return;
    }
    if (!last) return;
    attemptedLastNoteRestore.current = true;
    if (notes.some((n) => n.id === last)) {
      setLocation(`/notes/${last}`);
    }
  }, [routeNoteId, isLoading, isError, notes, setLocation]);

  const visibleNotes = useMemo(() => {
    const lowered = search.toLowerCase();
    return notes.filter((note) => {
      if (filter === "favorites" && !note.isFavorite) return false;
      if (lowered.length === 0) return true;
      const plain = htmlToPlainText(note.content).toLowerCase();
      return (
        note.title.toLowerCase().includes(lowered) ||
        note.content.toLowerCase().includes(lowered) ||
        plain.includes(lowered)
      );
    });
  }, [notes, filter, search]);

  useEffect(() => {
    if (visibleNotes.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!visibleNotes.some((note) => note.id === selectedId)) {
      const next = visibleNotes[0];
      setSelectedId(next.id);
      if (routeNoteId && next.id !== routeNoteId) {
        setLocation(`/notes/${next.id}`);
      }
    }
  }, [visibleNotes, selectedId, routeNoteId, setLocation]);

  const selected = visibleNotes.find((note) => note.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setLocation(`/notes/${id}`);
  };

  const handleCreate = async () => {
    if (
      selectedNoteDirty &&
      !window.confirm(
        "This note has unsaved changes. A local draft will be kept, but create a new note anyway?",
      )
    ) {
      return;
    }
    try {
      const created = await createNote();
      setSelectedId(created.id);
      setLocation(`/notes/${created.id}`);
      setSelectedNoteDirty(false);
      toast({ title: "Note created" });
    } catch {
      toast({ title: "Failed to create note", variant: "destructive" });
    }
  };

  const handleSave = async (
    payload: { title: string; content: string },
    options?: { silent?: boolean },
  ) => {
    if (!selected) return;
    try {
      await updateNote(selected.id, payload);
      if (!options?.silent) {
        toast({ title: "Note saved" });
      }
    } catch {
      toast({
        title: options?.silent ? "Auto-save failed" : "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async () => {
    if (!selected) return;
    setDuplicateBusy(true);
    try {
      const base = selected.title.trim();
      const title = base ? `${base} (copy)` : "Untitled Note (copy)";
      const created = await createNote({ title, content: selected.content });
      setSelectedId(created.id);
      setLocation(`/notes/${created.id}`);
      toast({ title: "Note duplicated" });
    } catch {
      toast({ title: "Failed to duplicate note", variant: "destructive" });
    } finally {
      setDuplicateBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteNote(selected.id);
      setLocation("/notes");
      toast({ title: "Note deleted" });
    } catch {
      toast({ title: "Failed to delete note", variant: "destructive" });
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem-3rem)] min-h-0 overflow-hidden rounded-xl border border-border/40">
      <NotesFolderSidebar filter={filter} onChange={setFilter} notes={notes} />
      <NoteList
        notes={visibleNotes}
        search={search}
        onSearchChange={setSearch}
        selectedId={selected?.id ?? null}
        onSelect={(note) => handleSelect(note.id)}
        onCreate={handleCreate}
        isCreating={isSaving && !selected}
        isLoading={isLoading}
      />
      {selected ? (
        <NoteEditor
          note={selected}
          onSave={handleSave}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onToggleFavorite={() => toggleFavorite(selected.id)}
          onDirtyChange={setSelectedNoteDirty}
          isSaving={isSaving}
          isDeleting={isDeleting}
          isDuplicating={duplicateBusy}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-background p-6">
          <Card className="w-full max-w-md border-border/60">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              {isLoading ? (
                <Spinner className="size-5" />
              ) : null}
              <p className="text-sm text-muted-foreground">
                {isError
                  ? "Failed to load notes. Please refresh."
                  : isLoading
                    ? "Loading your notes…"
                    : "Pick a note from the list or create a new one to begin."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
