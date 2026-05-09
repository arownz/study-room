import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface RichTextEditorHandle {
  focus: () => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  toolbarRight?: React.ReactNode;
  readOnly?: boolean;
}

type FormatAction =
  | { kind: "wrap"; before: string; after: string; placeholder: string }
  | { kind: "linePrefix"; prefix: string; placeholder: string }
  | { kind: "link" };

interface ToolbarButton {
  id: string;
  icon: typeof Bold;
  label: string;
  action: FormatAction;
}

const TOOLBAR_GROUPS: ToolbarButton[][] = [
  [
    {
      id: "h1",
      icon: Heading1,
      label: "Heading 1",
      action: { kind: "linePrefix", prefix: "# ", placeholder: "Heading" },
    },
    {
      id: "h2",
      icon: Heading2,
      label: "Heading 2",
      action: { kind: "linePrefix", prefix: "## ", placeholder: "Heading" },
    },
  ],
  [
    {
      id: "bold",
      icon: Bold,
      label: "Bold",
      action: { kind: "wrap", before: "**", after: "**", placeholder: "bold text" },
    },
    {
      id: "italic",
      icon: Italic,
      label: "Italic",
      action: { kind: "wrap", before: "_", after: "_", placeholder: "italic text" },
    },
    {
      id: "strike",
      icon: Strikethrough,
      label: "Strikethrough",
      action: { kind: "wrap", before: "~~", after: "~~", placeholder: "strikethrough" },
    },
    {
      id: "code",
      icon: Code,
      label: "Inline code",
      action: { kind: "wrap", before: "`", after: "`", placeholder: "code" },
    },
  ],
  [
    {
      id: "ul",
      icon: List,
      label: "Bullet list",
      action: { kind: "linePrefix", prefix: "- ", placeholder: "List item" },
    },
    {
      id: "ol",
      icon: ListOrdered,
      label: "Numbered list",
      action: { kind: "linePrefix", prefix: "1. ", placeholder: "List item" },
    },
    {
      id: "quote",
      icon: Quote,
      label: "Blockquote",
      action: { kind: "linePrefix", prefix: "> ", placeholder: "Quote" },
    },
  ],
  [
    {
      id: "link",
      icon: LinkIcon,
      label: "Link",
      action: { kind: "link" },
    },
  ],
];

function applyFormat(
  textarea: HTMLTextAreaElement,
  action: FormatAction,
  currentValue: string,
): { next: string; selectionStart: number; selectionEnd: number } {
  const { selectionStart, selectionEnd } = textarea;
  const selected = currentValue.slice(selectionStart, selectionEnd);

  if (action.kind === "wrap") {
    const text = selected.length > 0 ? selected : action.placeholder;
    const inserted = `${action.before}${text}${action.after}`;
    const next =
      currentValue.slice(0, selectionStart) +
      inserted +
      currentValue.slice(selectionEnd);
    const newStart = selectionStart + action.before.length;
    const newEnd = newStart + text.length;
    return { next, selectionStart: newStart, selectionEnd: newEnd };
  }

  if (action.kind === "linePrefix") {
    const lineStart = currentValue.lastIndexOf("\n", selectionStart - 1) + 1;
    const before = currentValue.slice(0, lineStart);
    const lineAndAfter = currentValue.slice(lineStart);
    const lineEnd = lineAndAfter.indexOf("\n");
    const line = lineEnd === -1 ? lineAndAfter : lineAndAfter.slice(0, lineEnd);
    const after = lineEnd === -1 ? "" : lineAndAfter.slice(lineEnd);

    const replacedLine = line.length > 0 ? `${action.prefix}${line}` : `${action.prefix}${action.placeholder}`;
    const next = `${before}${replacedLine}${after}`;
    const cursor = before.length + replacedLine.length;
    return { next, selectionStart: cursor, selectionEnd: cursor };
  }

  // link
  const url = window.prompt("Enter URL", "https://");
  if (!url) {
    return { next: currentValue, selectionStart, selectionEnd };
  }
  const label = selected.length > 0 ? selected : "link";
  const inserted = `[${label}](${url})`;
  const next =
    currentValue.slice(0, selectionStart) +
    inserted +
    currentValue.slice(selectionEnd);
  const cursor = selectionStart + inserted.length;
  return { next, selectionStart: cursor, selectionEnd: cursor };
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    { value, onChange, placeholder, className, minRows = 16, toolbarRight, readOnly = false },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const handleFormat = useCallback(
      (action: FormatAction) => {
        const textarea = textareaRef.current;
        if (!textarea || readOnly) return;
        const { next, selectionStart, selectionEnd } = applyFormat(textarea, action, value);
        onChange(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(selectionStart, selectionEnd);
        });
      },
      [onChange, readOnly, value],
    );

    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="flex items-center gap-1 border-b border-border/60 px-3 py-1.5">
          {TOOLBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="flex items-center gap-0.5">
              {idx > 0 && <Separator orientation="vertical" className="mx-1 h-5" />}
              {group.map((button) => {
                const Icon = button.icon;
                return (
                  <Button
                    key={button.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title={button.label}
                    disabled={readOnly}
                    onClick={() => handleFormat(button.action)}
                    data-testid={`rte-${button.id}`}
                  >
                    <Icon size={13} />
                  </Button>
                );
              })}
            </div>
          ))}
          {toolbarRight ? (
            <div className="ml-auto flex items-center gap-0.5">{toolbarRight}</div>
          ) : null}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          rows={minRows}
          spellCheck
          className="flex-1 resize-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          data-testid="rte-textarea"
        />
      </div>
    );
  },
);
