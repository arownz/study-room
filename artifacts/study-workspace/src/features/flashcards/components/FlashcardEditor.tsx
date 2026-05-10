import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor, richTextHasPlainContent } from "@/components/rich-editor/RichTextEditor";
import type { FlashcardViewModel } from "../hooks/use-flashcards";

interface FlashcardEditorProps {
  card: FlashcardViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { question: string; answer: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

export function FlashcardEditor({
  card,
  open,
  onOpenChange,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: FlashcardEditorProps) {
  const [question, setQuestion] = useState(card?.question ?? "");
  const [answer, setAnswer] = useState(card?.answer ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (card) {
      setQuestion(card.question);
      setAnswer(card.answer);
    }
  }, [card?.id, card?.question, card?.answer]);

  if (!card) return null;

  const questionOk = richTextHasPlainContent(question);
  const answerOk = richTextHasPlainContent(answer);
  const isDirty = question !== card.question || answer !== card.answer;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-[46rem] flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Edit flashcard</DialogTitle>
            <DialogDescription>Last edited {card.relativeUpdatedAt}</DialogDescription>
          </DialogHeader>
          <form
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4 pt-1"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!isDirty || isSaving || !questionOk || !answerOk) return;
              await onSave({ question, answer });
            }}
          >
            <div className="space-y-2">
              <Label>Question</Label>
              <RichTextEditor
                value={question}
                onChange={setQuestion}
                placeholder="Type or paste formatted text…"
                testId="input-edit-flashcard-question"
                enableRichMedia
                showMediaHint={false}
                minHeightClass="min-h-[9rem]"
                className="rounded-md border border-border/70"
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <RichTextEditor
                value={answer}
                onChange={setAnswer}
                placeholder="Answer with lists, emphasis, links, images…"
                testId="input-edit-flashcard-answer"
                enableRichMedia
                showMediaHint={false}
                minHeightClass="min-h-[9rem]"
                className="rounded-md border border-border/70"
              />
            </div>
            <DialogFooter className="shrink-0 border-t border-border/50 pt-4 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
              >
                <Trash2 size={14} />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || isSaving || !questionOk || !answerOk}
                  data-testid="button-submit-edit-flashcard"
                >
                  {isSaving ? <Spinner className="size-3" /> : <Save size={14} />}
                  Save
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the card from your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await onDelete();
                setConfirmDelete(false);
                onOpenChange(false);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
