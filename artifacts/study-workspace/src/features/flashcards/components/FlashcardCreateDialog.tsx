import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

export interface FlashcardCreateValues {
  question: string;
  answer: string;
}

interface FlashcardCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FlashcardCreateValues) => Promise<void> | void;
  isSubmitting: boolean;
}

export function FlashcardCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: FlashcardCreateDialogProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (open) {
      setQuestion("");
      setAnswer("");
    }
  }, [open]);

  const canSubmit = question.trim().length > 0 && answer.trim().length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New flashcard</DialogTitle>
          <DialogDescription>
            Create a question and its answer. You can study or edit it later.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canSubmit) return;
            await onSubmit({ question: question.trim(), answer: answer.trim() });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="flashcard-question">Question</Label>
            <Input
              id="flashcard-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What is photosynthesis?"
              autoFocus
              data-testid="input-flashcard-question"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flashcard-answer">Answer</Label>
            <Textarea
              id="flashcard-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={5}
              placeholder="The process by which plants convert light into chemical energy…"
              data-testid="input-flashcard-answer"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} data-testid="button-submit-flashcard">
              {isSubmitting ? <Spinner className="size-3" /> : null}
              Create card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
