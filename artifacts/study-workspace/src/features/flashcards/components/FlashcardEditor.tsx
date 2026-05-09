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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
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

  const isDirty = question !== card.question || answer !== card.answer;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit flashcard</DialogTitle>
            <DialogDescription>Last edited {card.relativeUpdatedAt}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!isDirty || isSaving) return;
              await onSave({ question: question.trim(), answer: answer.trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-flashcard-question">Question</Label>
              <Input
                id="edit-flashcard-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                data-testid="input-edit-flashcard-question"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-flashcard-answer">Answer</Label>
              <Textarea
                id="edit-flashcard-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                rows={5}
                data-testid="input-edit-flashcard-answer"
              />
            </div>
            <DialogFooter className="sm:justify-between">
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
                <Button type="submit" disabled={!isDirty || isSaving}>
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
