import { useCallback, useEffect, useRef, useState } from "react";
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
  ConfirmDialog,
} from "@/components/ui/confirm-dialog";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
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
  onDirtyChange?: (isDirty: boolean) => void;
  isSaving: boolean;
  isDeleting: boolean;
  isDuplicating?: boolean;
}

const NOTE_AUTOSAVE_MS = 1200;

export function NoteEditor({
  note,
  onSave,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onDirtyChange,
  isSaving,
  isDeleting,
  isDuplicating = false,
}: NoteEditorProps) {
  const DRAFT_KEY_PREFIX = "studyroom.note-draft:";
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [savedSnapshot, setSavedSnapshot] = useState({ title: note.title, content: note.content });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const latestDraftRef = useRef({ title: note.title, content: note.content, dirty: false });
  const lastAutoSavedKeyRef = useRef<string | null>(null);

  const setLatestDraftRef = useCallback(
    (next: { title?: string; content?: string; dirty?: boolean }) => {
      latestDraftRef.current = {
        title: next.title ?? latestDraftRef.current.title,
        content: next.content ?? latestDraftRef.current.content,
        dirty: next.dirty ?? latestDraftRef.current.dirty,
      };
    },
    [],
  );

  const persistDraft = useCallback(
    (draftTitle: string, draftContent: string) => {
      try {
        window.localStorage.setItem(
          `${DRAFT_KEY_PREFIX}${note.id}`,
          JSON.stringify({
            title: draftTitle,
            content: draftContent,
          }),
        );
      } catch {
        /* ignore quota / private mode */
      }
    },
    [note.id],
  );

  useEffect(() => {
    const draftKey = `${DRAFT_KEY_PREFIX}${note.id}`;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { title?: string; content?: string };
        const nextTitle = parsed.title ?? note.title;
        const nextContent = parsed.content ?? note.content;
        setTitle(nextTitle);
        setContent(nextContent);
        setSavedSnapshot({ title: note.title, content: note.content });
        setLatestDraftRef({ title: nextTitle, content: nextContent, dirty: true });
        lastAutoSavedKeyRef.current = null;
        return;
      }
    } catch {
      // ignore corrupted local draft
    }
    setTitle(note.title);
    setContent(note.content);
    setSavedSnapshot({ title: note.title, content: note.content });
    setLatestDraftRef({ title: note.title, content: note.content, dirty: false });
    lastAutoSavedKeyRef.current = JSON.stringify([note.title, note.content]);
  }, [note.id, note.title, note.content, setLatestDraftRef]);

  const isDirty = title !== savedSnapshot.title || content !== savedSnapshot.content;
  latestDraftRef.current = { title, content, dirty: isDirty };

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (isDirty) {
      persistDraft(title, content);
      return;
    }
    try {
      window.localStorage.removeItem(`${DRAFT_KEY_PREFIX}${note.id}`);
    } catch {
      /* ignore */
    }
  }, [DRAFT_KEY_PREFIX, content, isDirty, note.id, persistDraft, title]);

  useEffect(() => {
    return () => {
      if (!latestDraftRef.current.dirty) return;
      persistDraft(latestDraftRef.current.title, latestDraftRef.current.content);
    };
  }, [persistDraft]);

  const handleSave = useCallback(async (options?: { silent?: boolean }) => {
    if (!isDirty) return;
    const saveKey = JSON.stringify([title, content]);
    lastAutoSavedKeyRef.current = saveKey;
    try {
      await onSave({ title, content }, { silent: options?.silent ?? false });
      window.localStorage.removeItem(`${DRAFT_KEY_PREFIX}${note.id}`);
      setSavedSnapshot({ title, content });
      setLatestDraftRef({ title, content, dirty: false });
    } catch {
      if (lastAutoSavedKeyRef.current === saveKey) {
        lastAutoSavedKeyRef.current = null;
      }
    }
  }, [content, isDirty, note.id, onSave, setLatestDraftRef, title]);

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

  useEffect(() => {
    if (!isDirty || isSaving) return;
    const saveKey = JSON.stringify([title, content]);
    if (lastAutoSavedKeyRef.current === saveKey) return;
    const timer = window.setTimeout(() => {
      void handleSave({ silent: true });
    }, NOTE_AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [content, handleSave, isDirty, isSaving, title]);

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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background">
      <NoteEditorBreadcrumb note={{ ...note, title }} />

      <div className="shrink-0 px-6">
        <input
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            setLatestDraftRef({ title: nextTitle, content, dirty: true });
            persistDraft(nextTitle, content);
            lastAutoSavedKeyRef.current = null;
          }}
          className="w-full border-none bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Untitled"
          data-testid="input-note-title"
        />
      </div>

      <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col">
        <RichTextEditor
          className="flex h-full min-h-0 min-w-0 flex-1 flex-col"
          documentKey={note.id}
          layoutMode="canvas"
          value={content}
          onDraftSnapshot={(next) => {
            const nextDirty = latestDraftRef.current.dirty;
            setLatestDraftRef({
              title: latestDraftRef.current.title,
              content: next,
              dirty: nextDirty,
            });
            if (nextDirty) {
              persistDraft(latestDraftRef.current.title, next);
            }
          }}
          onChange={(next) => {
            setContent(next);
            setLatestDraftRef({ title, content: next, dirty: true });
            persistDraft(title, next);
            lastAutoSavedKeyRef.current = null;
          }}
          placeholder="Click the canvas to place the caret and type to add a text block."
          enableRichMedia
          showMediaHint
          toolbarRight={
            <>
              <HoverTooltip content={note.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onToggleFavorite}
                  data-testid="button-toggle-favorite"
                >
                  {note.isFavorite ? (
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                  ) : (
                    <StarOff size={13} />
                  )}
                </Button>
              </HoverTooltip>
              <HoverTooltip content="Save" disabled={!isDirty || isSaving}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => void handleSave()}
                  disabled={!isDirty || isSaving}
                  data-testid="button-save-note"
                >
                  {isSaving ? <Spinner className="size-3" /> : <Save size={13} />}
                </Button>
              </HoverTooltip>
              <HoverTooltip content="Delete">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive/70 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                  data-testid="button-delete-note"
                >
                  <Trash2 size={13} />
                </Button>
              </HoverTooltip>
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this note?"
        description="This action moves the note to deleted state. You can restore it later from the trash when that feature is available."
        confirmLabel={isDeleting ? "Deleting…" : "Delete note"}
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        confirmVariant="destructive"
        onConfirm={async (event) => {
          event.preventDefault();
          await onDelete();
          setConfirmDelete(false);
        }}
      />
    </div>
  );
}
