import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AiThread } from "@workspace/api-client-react";

function formatThreadDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startY = new Date(d);
  startY.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startY.getTime() - startToday.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationSidebar(props: {
  threads: AiThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  creating: boolean;
}) {
  return (
    <div className="w-52 border-r border-border/60 bg-sidebar flex flex-col shrink-0">
      <div className="p-3 border-b border-border/60 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">History</p>
        <Button
          size="icon"
          className="h-6 w-6"
          type="button"
          onClick={props.onNew}
          disabled={props.creating}
          data-testid="button-new-conversation"
        >
          <Plus size={12} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {props.threads.length === 0 && (
            <p className="text-[10px] text-muted-foreground px-2 py-3">No chats yet. Start one.</p>
          )}
          {props.threads.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => props.onSelect(conv.id)}
              className={cn(
                "w-full text-left rounded-md px-2.5 py-2 transition-colors",
                props.selectedId === conv.id ? "bg-sidebar-accent" : "hover:bg-muted/50",
              )}
              data-testid={`conversation-item-${conv.id}`}
            >
              <p className="text-xs font-medium truncate">{conv.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatThreadDate(conv.updatedAt)}</p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
