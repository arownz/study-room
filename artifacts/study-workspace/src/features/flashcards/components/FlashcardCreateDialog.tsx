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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { RichTextEditor, richTextHasPlainContent } from "@/components/rich-editor/RichTextEditor";

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

  const questionOk = richTextHasPlainContent(question);
  const answerOk = richTextHasPlainContent(answer);
  const canSubmit = questionOk && answerOk && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[46rem] flex-col gap-0 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>New flashcard</DialogTitle>
          <DialogDescription>
            Lists, emphasis, pasted images (when signed in), and modifier-click links during study sessions.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4 pt-1"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canSubmit) return;
            await onSubmit({ question, answer });
          }}
        >
          <div className="space-y-2">
            <Label>Question</Label>
            <RichTextEditor
              value={question}
              onChange={setQuestion}
              placeholder="What is photosynthesis?"
              enableRichMedia
              showMediaHint={false}
              minHeightClass="min-h-[9rem]"
              className="rounded-md border border-border/70"
              testId="input-flashcard-question"
            />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <RichTextEditor
              value={answer}
              onChange={setAnswer}
              placeholder="The process by which plants convert light into chemical energy…"
              enableRichMedia
              showMediaHint={false}
              minHeightClass="min-h-[9rem]"
              className="rounded-md border border-border/70"
              testId="input-flashcard-answer"
            />
          </div>
          <DialogFooter className="shrink-0 border-t border-border/50 pt-4">
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
