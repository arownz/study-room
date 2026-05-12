import { useCallback, useEffect, useState } from "react";
import { MoreHorizontal, Save, Star, StarOff, Trash2, Copy, FileStack, Printer, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { RichTextEditor, htmlToPlainText } from "@/components/rich-editor/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { NoteEditorBreadcrumb } from "./NoteEditorBreadcrumb";
import { NoteEditorFooter } from "./NoteEditorFooter";
import type { NoteViewModel } from "../types";

interface NoteEditorProps {
  note: NoteViewModel;
  onSave: (
    payload: { title: string; content: string },
    options?: { silent?: boolean },
  ) => Promise<void>;
  onDelete: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onToggleFavorite: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  isDuplicating?: boolean;
}

export function NoteEditor({
  note,
  onSave,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  isSaving,
  isDeleting,
  isDuplicating = false,
}: NoteEditorProps) {
  const DRAFT_KEY_PREFIX = "studyroom.note-draft:";
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hasPendingLocalChanges, setHasPendingLocalChanges] = useState(false);

  useEffect(() => {
    const draftKey = `${DRAFT_KEY_PREFIX}${note.id}`;
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { title?: string; content?: string };
        setTitle(parsed.title ?? note.title);
        setContent(parsed.content ?? note.content);
        setHasPendingLocalChanges(true);
        return;
      }
    } catch {
      // ignore corrupted local draft
    }
    setTitle(note.title);
    setContent(note.content);
    setHasPendingLocalChanges(false);
  }, [note.id]);

  useEffect(() => {
    if (hasPendingLocalChanges) return;
    setTitle(note.title);
    setContent(note.content);
  }, [note.title, note.content, hasPendingLocalChanges]);

  useEffect(() => {
    if (!hasPendingLocalChanges) return;
    const draftKey = `${DRAFT_KEY_PREFIX}${note.id}`;
    window.sessionStorage.setItem(
      draftKey,
      JSON.stringify({
        title,
        content,
      }),
    );
  }, [note.id, title, content, hasPendingLocalChanges]);

  const isDirty = hasPendingLocalChanges || title !== note.title || content !== note.content;

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    await onSave({ title, content }, { silent: false });
    window.sessionStorage.removeItem(`${DRAFT_KEY_PREFIX}${note.id}`);
    setHasPendingLocalChanges(false);
  }, [content, isDirty, note.id, onSave, title]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const openPrintPreview = (): boolean => {
    const preview = window.open("", "_blank");
    if (!preview?.document) {
      return false;
    }
    preview.document.open();
    preview.document.write(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title></title></head><body></body></html>`,
    );
    preview.document.close();
    preview.document.title = htmlToPlainText(title) || "Note";

    const h1 = preview.document.createElement("h1");
    h1.textContent = title.trim() || "Untitled";
    preview.document.body.appendChild(h1);

    const article = preview.document.createElement("article");
    article.innerHTML = content;
    preview.document.body.appendChild(article);

    preview.focus();
    preview.print();
    return true;
  };

  const copyText = async (payload: string, successDescription: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      toast({ title: "Copied", description: successDescription });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
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
          documentKey={note.id}
          layoutMode="canvas"
          value={content}
          onChange={(next) => {
            setContent(next);
            setHasPendingLocalChanges(true);
          }}
          placeholder="Start writing your note…"
          enableRichMedia
          showMediaHint
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    data-testid="button-more-options"
                    type="button"
                  >
                    <MoreHorizontal size={13} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    disabled={isDuplicating}
                    onClick={() => void onDuplicate()}
                    data-testid="menu-item-duplicate-note"
                  >
                    {isDuplicating ? (
                      <Spinner className="mr-2 size-4" />
                    ) : (
                      <FileStack className="mr-2 size-4" />
                    )}
                    Duplicate note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      void copyText(title.trim() || "Untitled", "Note title copied to clipboard.")
                    }
                  >
                    <Copy className="mr-2 size-4" />
                    Copy title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void copyText(htmlToPlainText(content), "Plain text copied.")}>
                    <Copy className="mr-2 size-4" />
                    Copy as plain text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void copyText(content, "HTML copied to clipboard.")}>
                    <FileCode className="mr-2 size-4" />
                    Copy HTML
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (!openPrintPreview()) {
                        toast({
                          title: "Print blocked",
                          description:
                            "Your browser prevented the print preview window — allow pop-ups for this site.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Printer className="mr-2 size-4" />
                    Print
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
