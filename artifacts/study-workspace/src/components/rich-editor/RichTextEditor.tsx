import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  UnlinkIcon,
  UnderlineIcon,
  Code as CodeIcon,
  CheckSquare,
} from "lucide-react";
import { ApiError, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { shortcutModLabel } from "@/lib/platform";

function isLikelyImageFile(file: File): boolean {
  return file.type === "" || file.type.startsWith("image/");
}

function clipboardItemIsImage(item: DataTransferItem): boolean {
  return item.kind === "file" && (item.type === "" || item.type.startsWith("image/"));
}

async function uploadNoteImageAsset(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const body = await customFetch<unknown>("/api/v1/note-images", {
    method: "POST",
    body: form,
  });
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    body.data &&
    typeof body.data === "object" &&
    "url" in body.data &&
    typeof (body.data as { url: unknown }).url === "string"
  ) {
    return (body.data as { url: string }).url;
  }
  throw new Error("Unexpected response from server.");
}

export interface RichTextEditorHandle {
  focus: () => void;
}

interface RichTextEditorProps {
  /** HTML string. Empty string when the document is blank. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  toolbarRight?: React.ReactNode;
  readOnly?: boolean;
  /** Optional id forwarded to data-testid for tests. */
  testId?: string;
  /** Image upload/paste — requires authenticated session cookie. Default true for notes. */
  enableRichMedia?: boolean;
  /** Editor surface min-height (tailwind class). Default min-h-[18rem]. */
  minHeightClass?: string;
  /** Show “paste image / ctrl-click link” helper under toolbar. */
  showMediaHint?: boolean;
}

interface ToolbarButton {
  id: string;
  icon: typeof Bold;
  label: string;
  isActive: (editor: Editor) => boolean;
  command: (editor: Editor) => void;
  isDisabled?: (editor: Editor) => boolean;
}

function buildToolbarGroups(): ToolbarButton[][] {
  return [
    [
      {
        id: "h1",
        icon: Heading1,
        label: "Heading 1",
        isActive: (editor) => editor.isActive("heading", { level: 1 }),
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        icon: Heading2,
        label: "Heading 2",
        isActive: (editor) => editor.isActive("heading", { level: 2 }),
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        icon: Heading3,
        label: "Heading 3",
        isActive: (editor) => editor.isActive("heading", { level: 3 }),
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        id: "bold",
        icon: Bold,
        label: "Bold",
        isActive: (editor) => editor.isActive("bold"),
        command: (editor) => editor.chain().focus().toggleBold().run(),
      },
      {
        id: "italic",
        icon: Italic,
        label: "Italic",
        isActive: (editor) => editor.isActive("italic"),
        command: (editor) => editor.chain().focus().toggleItalic().run(),
      },
      {
        id: "underline",
        icon: UnderlineIcon,
        label: "Underline",
        isActive: (editor) => editor.isActive("underline"),
        command: (editor) => editor.chain().focus().toggleUnderline().run(),
      },
      {
        id: "strike",
        icon: Strikethrough,
        label: "Strikethrough",
        isActive: (editor) => editor.isActive("strike"),
        command: (editor) => editor.chain().focus().toggleStrike().run(),
      },
      {
        id: "code",
        icon: CodeIcon,
        label: "Inline code",
        isActive: (editor) => editor.isActive("code"),
        command: (editor) => editor.chain().focus().toggleCode().run(),
      },
    ],
    [
      {
        id: "ul",
        icon: List,
        label: "Bullet list",
        isActive: (editor) => editor.isActive("bulletList"),
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ol",
        icon: ListOrdered,
        label: "Numbered list",
        isActive: (editor) => editor.isActive("orderedList"),
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "task",
        icon: CheckSquare,
        label: "Checkbox",
        isActive: (editor) => editor.isActive("taskList"),
        command: (editor) => editor.chain().focus().toggleList("taskList", "taskItem").run(),
      },
      {
        id: "quote",
        icon: Quote,
        label: "Blockquote",
        isActive: (editor) => editor.isActive("blockquote"),
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
      },
    ],
    [
      {
        id: "link",
        icon: LinkIcon,
        label: "Link",
        isActive: (editor) => editor.isActive("link"),
        command: (editor) => {
          const previousUrl = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Enter URL", previousUrl ?? "https://");
          if (url === null) return;
          if (url.trim() === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
            .run();
        },
      },
      {
        id: "unlink",
        icon: UnlinkIcon,
        label: "Remove link",
        isActive: () => false,
        isDisabled: (editor) => !editor.isActive("link"),
        command: (editor) => editor.chain().focus().unsetLink().run(),
      },
    ],
    [
      {
        id: "undo",
        icon: Undo2,
        label: "Undo",
        isActive: () => false,
        isDisabled: (editor) => !editor.can().undo(),
        command: (editor) => editor.chain().focus().undo().run(),
      },
      {
        id: "redo",
        icon: Redo2,
        label: "Redo",
        isActive: () => false,
        isDisabled: (editor) => !editor.can().redo(),
        command: (editor) => editor.chain().focus().redo().run(),
      },
    ],
  ];
}

const TOOLBAR_GROUPS = buildToolbarGroups();

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      onChange,
      placeholder,
      className,
      toolbarRight,
      readOnly = false,
      testId,
      enableRichMedia = true,
      minHeightClass = "min-h-[18rem]",
      showMediaHint = true,
    },
    ref,
  ) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [imageBusy, setImageBusy] = useState(false);
    const uploadingRef = useRef(false);
    const editorRef = useRef<Editor | null>(null);

    const insertUploadedImage = useCallback((editorInstance: Editor, file: File) => {
      if (!enableRichMedia || uploadingRef.current) return;
      uploadingRef.current = true;
      setImageBusy(true);
      void uploadNoteImageAsset(file)
        .then((url) => {
          editorInstance.chain().focus().setImage({ src: url }).run();
        })
        .catch((err: unknown) => {
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Image upload failed.";
          window.alert(message);
        })
        .finally(() => {
          uploadingRef.current = false;
          setImageBusy(false);
        });
    }, [enableRichMedia]);

    const extensions = useMemo(
      () =>
        [
          StarterKit.configure({
            heading: { levels: [1, 2, 3] },
          }),
          Underline,
          TaskList.configure({
            // Optional configuration can go here
          }),
          TaskItem.configure({
            nested: true,
          }),
          Placeholder.configure({
            placeholder: placeholder ?? "Start writing…",
          }),
          Link.configure({
            openOnClick: false,
            autolink: true,
            linkOnPaste: true,
            HTMLAttributes: {
              rel: "noopener noreferrer",
              target: "_blank",
              title: `${shortcutModLabel()}-click to open in a new tab`,
              class:
                "text-primary underline underline-offset-2 hover:text-primary/90 cursor-pointer",
            },
          }),
          ...(enableRichMedia
            ? [
                Image.configure({
                  inline: false,
                  allowBase64: true,
                  HTMLAttributes: {
                    class:
                      "rounded-lg max-w-full h-auto max-h-[min(520px,80vh)] mx-auto my-4 block shadow-sm ring-1 ring-border/60",
                  },
                }),
              ]
            : []),
        ].filter(Boolean),
      [placeholder, enableRichMedia],
    );

    const editor = useEditor({
      extensions,
      content: value || "",
      editable: !readOnly,
      editorProps: {
        attributes: {
          class: cn(
            "tiptap prose prose-sm dark:prose-invert max-w-none",
            minHeightClass,
            "flex-1 px-6 py-4 text-sm leading-relaxed text-foreground",
            "focus:outline-none",
            "[&_p]:my-2 [&_h1]:mt-4 [&_h2]:mt-4 [&_h3]:mt-4",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
            "[&_li[data-checked]]:list-none", // Remove bullets for task list items
          ),
          "data-testid": testId ?? "rte-editor",
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const next = html === "<p></p>" ? "" : html;
        if (next !== value) {
          onChange(next);
        }
      },
    });

    editorRef.current = editor ?? null;

    useEffect(() => {
      if (!editor) return;
      editor.setOptions({
        editorProps: {
          attributes: editor.options.editorProps.attributes,
          handleDrop:
            enableRichMedia && !readOnly
              ? (_view, event, _slice, moved) => {
                  if (moved || !editorRef.current) return false;
                  const dt = event.dataTransfer;
                  if (!dt?.files?.length) return false;
                  const file = Array.from(dt.files).find((f) => isLikelyImageFile(f));
                  if (!file) return false;
                  event.preventDefault();
                  insertUploadedImage(editorRef.current, file);
                  return true;
                }
              : undefined,
          handlePaste:
            enableRichMedia && !readOnly
              ? (_view, event) => {
                  if (!editorRef.current) return false;
                  const dt = event.clipboardData;
                  if (!dt?.items?.length) return false;
                  for (let i = 0; i < dt.items.length; i++) {
                    const item = dt.items[i];
                    if (clipboardItemIsImage(item)) {
                      const file = item.getAsFile();
                      if (file) {
                        event.preventDefault();
                        insertUploadedImage(editorRef.current!, file);
                        return true;
                      }
                    }
                  }
                  return false;
                }
              : undefined,
          handleClick: (_view, _pos, event) => {
            if (!(event instanceof MouseEvent) || !(event.ctrlKey || event.metaKey))
              return false;
            let el: HTMLElement | null = event.target as HTMLElement | null;
            while (el && el.tagName?.toUpperCase() !== "A") {
              el = el.parentElement;
            }
            const href =
              el && el.tagName === "A" ? (el as HTMLAnchorElement).getAttribute("href") : null;
            if (!href || href.toLowerCase().startsWith("javascript:")) return false;
            event.preventDefault();
            window.open(href, "_blank", "noopener,noreferrer");
            return true;
          },
        },
      });
    }, [editor, insertUploadedImage, readOnly, enableRichMedia]);

    useImperativeHandle(ref, () => ({
      focus: () => editor?.chain().focus().run(),
    }));

    useEffect(() => {
      if (!editor) return;
      const current = editor.getHTML();
      const normalized = value || "";
      if (current === normalized || (current === "<p></p>" && normalized === "")) {
        return;
      }
      editor.commands.setContent(normalized || "", false);
    }, [editor, value]);

    useEffect(() => {
      editor?.setEditable(!readOnly);
    }, [editor, readOnly]);

    const onPickImageFiles = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !isLikelyImageFile(file) || !editor) return;
        insertUploadedImage(editor, file);
      },
      [editor, insertUploadedImage],
    );

    const modLabel = shortcutModLabel();

    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        <div className="flex flex-wrap items-center gap-1 border-b border-border/60 px-3 py-1.5">
          {TOOLBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="flex items-center gap-0.5">
              {idx > 0 && <Separator orientation="vertical" className="mx-1 h-5" />}
              {group.map((button) => {
                const Icon = button.icon;
                const isActive = editor ? button.isActive(editor) : false;
                const isDisabled = readOnly
                  ? true
                  : editor
                    ? (button.isDisabled?.(editor) ?? false)
                    : true;
                return (
                  <Button
                    key={button.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", isActive && "bg-muted text-foreground")}
                    title={button.label}
                    disabled={isDisabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => editor && button.command(editor)}
                    data-testid={`rte-${button.id}`}
                  >
                    <Icon size={13} />
                  </Button>
                );
              })}
            </div>
          ))}
          {enableRichMedia ? (
            <div className="flex items-center gap-0.5">
              <Separator orientation="vertical" className="mx-1 h-5" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Upload image"
                disabled={readOnly || imageBusy}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => imageInputRef.current?.click()}
                data-testid="rte-image-upload"
              >
                {imageBusy ? <Spinner className="size-3" /> : <ImagePlus size={13} />}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={onPickImageFiles}
              />
            </div>
          ) : null}
          {toolbarRight ? (
            <div className="ml-auto flex items-center gap-0.5">{toolbarRight}</div>
          ) : null}
        </div>
        {showMediaHint ? (
          <p className="px-6 pt-2 text-[11px] text-muted-foreground">
            {enableRichMedia ? "Paste or drop images into the canvas. " : ""}
            Hold {modLabel} and click a link to open it in a new tab.
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <EditorContent editor={editor} className="flex flex-1" />
        </div>
      </div>
    );
  },
);

/** Strip HTML tags for use in list previews / search snippets. */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** True if pasted HTML contributes visible text beyond empty paragraphs. */
export function richTextHasPlainContent(html: string): boolean {
  return htmlToPlainText(html).trim().length > 0;
}
