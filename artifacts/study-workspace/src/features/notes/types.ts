import type { Note as ApiNote } from "@workspace/api-client-react";

export type NotesFilter = "all" | "favorites";

export interface NoteViewModel extends ApiNote {
  isFavorite: boolean;
  preview: string;
  relativeUpdatedAt: string;
}

export function buildNoteViewModel(note: ApiNote, isFavorite: boolean): NoteViewModel {
  const stripped = note.content.replace(/[#*_`>~\-]/g, "").trim();
  const preview = stripped.length > 0 ? stripped.slice(0, 140) : "No content yet";
  const relativeUpdatedAt = formatRelativeTime(note.updatedAt);
  return { ...note, isFavorite, preview, relativeUpdatedAt };
}

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffSeconds = Math.round((Date.now() - ts) / 1000);
  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString();
}
