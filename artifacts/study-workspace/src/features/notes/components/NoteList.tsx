import { motion } from "framer-motion";
import { Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { NoteViewModel } from "../types";

interface NoteListProps {
  notes: NoteViewModel[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (note: NoteViewModel) => void;
  onCreate: () => void;
  isCreating: boolean;
  isLoading: boolean;
}

export function NoteList({
  notes,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onCreate,
  isCreating,
  isLoading,
}: NoteListProps) {
  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-r border-border/60">
      <div className="space-y-2 border-b border-border/60 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-7 pl-7 text-xs"
              data-testid="input-search-notes"
            />
          </div>
          <Button
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={onCreate}
            disabled={isCreating}
            data-testid="button-create-note"
          >
            {isCreating ? <Spinner className="size-3" /> : <Plus size={13} />}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {isLoading && notes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-4" />
            </div>
          ) : notes.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">No notes found.</p>
          ) : (
            notes.map((note) => (
              <motion.button
                key={note.id}
                whileHover={{ x: 2 }}
                onClick={() => onSelect(note)}
                className={cn(
                  "group w-full rounded-md p-2.5 text-left transition-colors",
                  note.id === selectedId ? "bg-sidebar-accent" : "hover:bg-muted/50",
                )}
                data-testid={`note-list-item-${note.id}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="truncate text-xs font-medium leading-snug">{note.title}</p>
                  {note.isFavorite ? (
                    <Star
                      size={10}
                      className="mt-0.5 flex-shrink-0 fill-amber-400 text-amber-400"
                    />
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                  {note.preview}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{note.relativeUpdatedAt}</span>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
