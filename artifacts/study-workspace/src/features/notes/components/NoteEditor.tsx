import { useEffect, useState } from "react";
import { MoreHorizontal, Save, Star, StarOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichTextEditor } from "@/components/rich-editor/RichTextEditor";
import { NoteEditorBreadcrumb } from "./NoteEditorBreadcrumb";
import { NoteEditorFooter } from "./NoteEditorFooter";
import type { NoteViewModel } from "../types";

interface NoteEditorProps {
  note: NoteViewModel;
  onSave: (payload: { title: string; content: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  onToggleFavorite: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export function NoteEditor({
  note,
  onSave,
  onDelete,
  onToggleFavorite,
  isSaving,
  isDeleting,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);

  const isDirty = title !== note.title || content !== note.content;

  const handleSave = async () => {
    if (!isDirty) return;
    await onSave({ title, content });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      <NoteEditorBreadcrumb note={{ ...note, title }} />

      <div className="px-6">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border-none bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Untitled"
          data-testid="input-note-title"
        />
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing… (markdown supported)"
          toolbarRight={
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleFavorite}
                title={note.isFavorite ? "Remove from favorites" : "Add to favorites"}
                data-testid="button-toggle-favorite"
              >
                {note.isFavorite ? (
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                ) : (
                  <StarOff size={13} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                title="Save"
                data-testid="button-save-note"
              >
                {isSaving ? <Spinner className="size-3" /> : <Save size={13} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive/70 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                data-testid="button-delete-note"
              >
                <Trash2 size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-more-options">
                <MoreHorizontal size={13} />
              </Button>
            </>
          }
        />
      </div>

      <NoteEditorFooter
        content={content}
        relativeUpdatedAt={note.relativeUpdatedAt}
        isSaving={isSaving}
        isDirty={isDirty}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action moves the note to deleted state. You can restore it later from the trash
              when that feature is available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await onDelete();
                setConfirmDelete(false);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
