import { useState } from "react";
import { CheckSquare, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  text: string;
  done: boolean;
}

export function StudyRoomGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [draft, setDraft] = useState("");

  const addGoal = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setGoals((prev) => [...prev, { id: `${Date.now()}`, text: trimmed, done: false }]);
    setDraft("");
  };

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, done: !goal.done } : goal)),
    );
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
                onClick={() => toggleGoal(goal.id)}
                className="group flex w-full items-start gap-2 text-left"
                data-testid={`goal-item-${goal.id}`}
              >
                {goal.done ? (
                  <CheckSquare size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                ) : (
                  <Square
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
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
        <Button size="icon" className="h-7 w-7" onClick={addGoal} data-testid="button-add-goal">
          <Plus size={12} />
        </Button>
      </div>
    </div>
  );
}
