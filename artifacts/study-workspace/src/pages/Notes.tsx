import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { NoteEditor } from "@/features/notes/components/NoteEditor";
import { NoteList } from "@/features/notes/components/NoteList";
import { NotesFolderSidebar } from "@/features/notes/components/NotesFolderSidebar";
import { useNotes } from "@/features/notes/hooks/use-notes";
import type { NotesFilter } from "@/features/notes/types";
import { htmlToPlainText } from "@/components/rich-editor/RichTextEditor";

const LAST_NOTE_ID_KEY = "studyroom.notes.lastNoteId";

function readLastNoteId(): string | null {
  try {
    return (
      window.localStorage.getItem(LAST_NOTE_ID_KEY) ??
      window.sessionStorage.getItem(LAST_NOTE_ID_KEY)
    );
  } catch {
    return null;
  }
}

function writeLastNoteId(noteId: string): void {
  try {
    window.localStorage.setItem(LAST_NOTE_ID_KEY, noteId);
    window.sessionStorage.setItem(LAST_NOTE_ID_KEY, noteId);
  } catch {
    /* ignore quota / private mode */
  }
}

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
  const [selectedId, setSelectedId] = useState<string>(() => routeNoteId ?? readLastNoteId() ?? "");
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [selectedNoteDirty, setSelectedNoteDirty] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);

  useEffect(() => {
    if (routeNoteId) {
      setSelectedId(routeNoteId);
      writeLastNoteId(routeNoteId);
    }
  }, [routeNoteId]);

  useEffect(() => {
    if (selectedId) {
      writeLastNoteId(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (routeNoteId || isLoading || isError || !selectedId) return;
    if (notes.some((note) => note.id === selectedId)) {
      setLocation(`/notes/${selectedId}`);
      return;
    }
  }, [routeNoteId, isLoading, isError, notes, selectedId, setLocation]);

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
      const storedId = readLastNoteId();
      const next =
        (storedId ? visibleNotes.find((note) => note.id === storedId) : null) ??
        visibleNotes[0];
      setSelectedId(next.id);
      writeLastNoteId(next.id);
      if (!routeNoteId || next.id !== routeNoteId) {
        setLocation(`/notes/${next.id}`);
      }
    }
  }, [visibleNotes, selectedId, routeNoteId, setLocation]);

  const selected = visibleNotes.find((note) => note.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    writeLastNoteId(id);
    setLocation(`/notes/${id}`);
  };

  const createNoteNow = async () => {
    try {
      const created = await createNote();
      setSelectedId(created.id);
      writeLastNoteId(created.id);
      setLocation(`/notes/${created.id}`);
      setSelectedNoteDirty(false);
      toast({ title: "Note created" });
    } catch {
      toast({ title: "Failed to create note", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (selectedNoteDirty) {
      setCreateConfirmOpen(true);
      return;
    }
    await createNoteNow();
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
      throw new Error("note-save-failed");
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
      writeLastNoteId(created.id);
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
      <ConfirmDialog
        open={createConfirmOpen}
        onOpenChange={setCreateConfirmOpen}
        title="Create a new note?"
        description="This note still has unsaved changes. Your local draft will be kept, but you will switch to a new note."
        confirmLabel="Create note"
        onConfirm={async (event) => {
          event.preventDefault();
          setCreateConfirmOpen(false);
          await createNoteNow();
        }}
      />
    </div>
  );
}
