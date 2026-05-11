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

export interface FlashcardDeckCreateValues {
  title: string;
  description: string | null;
}

interface FlashcardDeckCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FlashcardDeckCreateValues) => Promise<void> | void;
  isSubmitting: boolean;
}

export function FlashcardDeckCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: FlashcardDeckCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New deck</DialogTitle>
          <DialogDescription>
            Give your deck a name. You can add flashcards after it&apos;s created.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSubmit) return;
            await onSubmit({
              title: title.trim(),
              description: description.trim() || null,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="deck-title">Title</Label>
            <Input
              id="deck-title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder="Biology — Cell structure"
              autoFocus
              data-testid="input-deck-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deck-desc">Description (optional)</Label>
            <Textarea
              id="deck-desc"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
              placeholder="Chapter 3, midterm prep…"
              data-testid="input-deck-description"
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
            <Button type="submit" disabled={!canSubmit} data-testid="button-submit-deck">
              {isSubmitting ? <Spinner className="size-3" /> : null}
              Create deck
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
