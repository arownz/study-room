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
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";

export interface StudyRoomCreateValues {
  name: string;
  description: string;
  isPublic: boolean;
}

interface StudyRoomCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: StudyRoomCreateValues) => Promise<void>;
  isSubmitting: boolean;
}

export function StudyRoomCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: StudyRoomCreateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIsPublic(false);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New study room</DialogTitle>
          <DialogDescription>
            Create a focused space for your group to study together.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canSubmit) return;
            await onSubmit({
              name: name.trim(),
              description: description.trim(),
              isPublic,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Calculus Study Group"
              autoFocus
              data-testid="input-room-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-description">Description</Label>
            <Textarea
              id="room-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Topic, schedule, or quick description"
              data-testid="input-room-description"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <p className="text-sm font-medium">Public room</p>
              <p className="text-xs text-muted-foreground">
                Anyone in your workspace can discover this room.
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
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
            <Button type="submit" disabled={!canSubmit} data-testid="button-submit-room">
              {isSubmitting ? <Spinner className="size-3" /> : null}
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
