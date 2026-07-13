import sanitizeHtml from "sanitize-html"

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "blockquote", "pre", "code",
    "ol", "ul", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6", "sub", "sup",
  ],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
  },
}

export function sanitizeRichText(value: string | null | undefined): string {
  return sanitizeHtml(value ?? "", RICH_TEXT_OPTIONS)
}

export function richTextToPlainText(value: string | null | undefined): string {
  return sanitizeRichText(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|blockquote|pre|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
