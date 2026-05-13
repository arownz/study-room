/** Shared between rich-editor canvas and other consumers. */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function richTextHasPlainContent(html: string): boolean {
  return htmlToPlainText(html).trim().length > 0;
}
