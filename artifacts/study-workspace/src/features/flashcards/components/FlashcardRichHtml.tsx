import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

/** Remove script tags — same-origin user content; XSS hardening baseline. */
export function stripUnsafeHtmlFragment(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

interface FlashcardRichHtmlProps {
  html: string;
  className?: string;
  lineClamp?: 2 | 3 | 4 | 5;
  /** Center prose (study card). */
  centered?: boolean;
  /**
   * Modifier+click opens links in a new tab; plain clicks do not navigate (avoids leaving study).
   */
  studyLinkClicks?: boolean;
}

const LINE_CLAMP_MAP: Record<NonNullable<FlashcardRichHtmlProps["lineClamp"]>, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
};

export function FlashcardRichHtml({
  html,
  className,
  lineClamp,
  centered,
  studyLinkClicks,
}: FlashcardRichHtmlProps) {
  const safe = stripUnsafeHtmlFragment(html || "");
  const hasContent = safe.replace(/<[^>]+>/g, "").trim().length > 0 || safe.includes("<img");

  const onClickCapture = studyLinkClicks
    ? (event: MouseEvent<HTMLDivElement>) => {
        const anchor = (event.target as HTMLElement).closest("a[href]");
        if (!(anchor instanceof HTMLAnchorElement) || !anchor.href) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.metaKey || event.ctrlKey) {
          window.open(anchor.href, "_blank", "noopener,noreferrer");
        }
      }
    : undefined;

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_img]:max-h-48 [&_img]:rounded-md [&_img]:mx-auto [&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline [&_a]:break-all",
        centered && "text-center **:text-center",
        lineClamp != null ? LINE_CLAMP_MAP[lineClamp] : undefined,
        className,
      )}
      onClickCapture={onClickCapture}
      dangerouslySetInnerHTML={{
        __html: hasContent ? safe : '<span class="text-muted-foreground">—</span>',
      }}
    />
  );
}
