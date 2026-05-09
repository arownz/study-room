import { FileText, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotesFilter, NoteViewModel } from "../types";

interface NotesFolderSidebarProps {
  filter: NotesFilter;
  onChange: (filter: NotesFilter) => void;
  notes: NoteViewModel[];
}

interface FilterEntry {
  id: NotesFilter;
  label: string;
  icon: typeof FileText;
  count: number;
  iconClassName?: string;
}

export function NotesFolderSidebar({ filter, onChange, notes }: NotesFolderSidebarProps) {
  const favoriteCount = notes.filter((n) => n.isFavorite).length;
  const filters: FilterEntry[] = [
    { id: "all", label: "All Notes", icon: FileText, count: notes.length },
    {
      id: "favorites",
      label: "Favorites",
      icon: Star,
      count: favoriteCount,
      iconClassName: "text-amber-400",
    },
  ];

  return (
    <div className="flex w-44 flex-shrink-0 flex-col border-r border-border/60 bg-sidebar">
      <div className="border-b border-border/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {filters.map((entry) => {
            const Icon = entry.icon;
            const active = filter === entry.id;
            return (
              <button
                key={entry.id}
                onClick={() => onChange(entry.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
                data-testid={`notes-filter-${entry.id}`}
              >
                <Icon size={13} className={entry.iconClassName} />
                {entry.label}
                <span className="ml-auto text-[10px] text-muted-foreground">{entry.count}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
