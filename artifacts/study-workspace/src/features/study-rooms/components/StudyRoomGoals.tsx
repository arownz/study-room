import { useState } from "react";
import { CheckSquare, Plus, Square } from "lucide-react";
import {
  useCreateStudyRoomGoal,
  useListStudyRoomGoals,
  useUpdateStudyRoomGoal,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function StudyRoomGoals(props: { roomId: string }) {
  const [draft, setDraft] = useState("");
  const { data: goalsEnvelope } = useListStudyRoomGoals(props.roomId);
  const goals = goalsEnvelope?.data?.items ?? [];
  const createGoal = useCreateStudyRoomGoal();
  const updateGoal = useUpdateStudyRoomGoal();

  const addGoal = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    createGoal.mutate({ roomId: props.roomId, data: { text: trimmed } });
    setDraft("");
  };

  const toggleGoal = (id: string, done: boolean) => {
    updateGoal.mutate({ roomId: props.roomId, goalId: id, data: { done: !done } });
  };

  return (
    <div className="flex w-56 shrink-0 flex-col border-l border-border/60">
      <div className="border-b border-border/60 p-3">
        <p className="text-xs font-semibold">Session goals</p>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {goals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No goals yet. Add one to track your session.
            </p>
          ) : (
            goals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id, goal.done)}
                className="group flex w-full items-start gap-2 text-left"
                data-testid={`goal-item-${goal.id}`}
              >
                {goal.done ? (
                  <CheckSquare size={14} className="mt-0.5 shrink-0 text-primary" />
                ) : (
                  <Square
                    size={14}
                    className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                )}
                <span
                  className={cn(
                    "text-xs leading-snug",
                    goal.done && "text-muted-foreground line-through",
                  )}
                >
                  {goal.text}
                </span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-1 border-t border-border/60 p-3">
        <Input
          placeholder="Add goal..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addGoal()}
          className="h-7 text-xs"
          data-testid="input-add-goal"
        />
        <Button
          size="icon"
          className="h-7 w-7"
          type="button"
          onClick={addGoal}
          disabled={createGoal.isPending}
          data-testid="button-add-goal"
        >
          <Plus size={12} />
        </Button>
      </div>
    </div>
  );
}
