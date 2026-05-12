import { useMemo } from "react";
import { htmlToPlainText } from "@/components/rich-editor/RichTextEditor";

interface NoteEditorFooterProps {
  content: string;
  relativeUpdatedAt: string;
  isSaving: boolean;
  isDirty: boolean;
}

export function NoteEditorFooter({
  content,
  relativeUpdatedAt,
  isSaving,
  isDirty,
}: NoteEditorFooterProps) {
  const { wordCount, charCount } = useMemo(() => {
    const plain = htmlToPlainText(content);
    return {
      wordCount: plain.split(/\s+/).filter(Boolean).length,
      charCount: plain.length,
    };
  }, [content]);

  return (
    <div className="flex shrink-0 items-center gap-4 border-t border-border/60 px-6 py-2 text-[10px] text-muted-foreground">
      <span>{wordCount} words</span>
      <span>{charCount} characters</span>
      <span className="ml-auto flex items-center gap-1">
        {isSaving ? "Saving…" : isDirty ? "Unsaved changes" : `Last edited ${relativeUpdatedAt}`}
      </span>
    </div>
  );
}
