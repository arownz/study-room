import { motion } from "framer-motion";
import { LayoutTemplate, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { WhiteboardViewModel } from "../hooks/use-whiteboards";

interface WhiteboardListProps {
  boards: WhiteboardViewModel[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (board: WhiteboardViewModel) => void;
  onDelete: (board: WhiteboardViewModel) => void;
  onCreate: () => void;
  isCreating: boolean;
  isLoading: boolean;
  deletingId?: string | null;
}

export function WhiteboardList({
  boards,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onDelete,
  onCreate,
  isCreating,
  isLoading,
  deletingId,
}: WhiteboardListProps) {
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-border/60">
      <div className="space-y-2 border-b border-border/60 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search boards..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-7 pl-7 text-xs"
              data-testid="input-search-whiteboards"
            />
          </div>
          <Button
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onCreate}
            disabled={isCreating}
            data-testid="button-create-whiteboard"
          >
            {isCreating ? <Spinner className="size-3" /> : <Plus size={13} />}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {isLoading && boards.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-4" />
            </div>
          ) : boards.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">No whiteboards found.</p>
          ) : (
            boards.map((board) => (
              <motion.div
                key={board.id}
                whileHover={{ x: 2 }}
                className={cn(
                  "group w-full rounded-md p-2.5 text-left transition-colors",
                  board.id === selectedId ? "bg-sidebar-accent" : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(board)}
                    className="min-w-0 flex-1 text-left"
                    data-testid={`whiteboard-list-item-${board.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-xs font-medium leading-snug">
                        {board.title.trim() || "Untitled Whiteboard"}
                      </p>
                      <LayoutTemplate size={11} className="mt-0.5 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">{board.relativeUpdatedAt}</span>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive/70 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 data-[active=true]:opacity-100"
                    onClick={() => onDelete(board)}
                    disabled={deletingId === board.id}
                    data-active={board.id === selectedId}
                    data-testid={`button-delete-whiteboard-${board.id}`}
                  >
                    {deletingId === board.id ? <Spinner className="size-3" /> : <Trash2 size={13} />}
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
