import { ChevronRight, Folder } from "lucide-react";
import type { NoteViewModel } from "../types";

interface NoteEditorBreadcrumbProps {
  note: NoteViewModel;
}

export function NoteEditorBreadcrumb({ note }: NoteEditorBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1.5 px-6 pb-2 pt-4 text-xs text-muted-foreground">
      <Folder size={11} />
      <span>Notes</span>
      <ChevronRight size={10} />
      <span className="font-medium text-foreground">{note.title}</span>
    </div>
  );
}
