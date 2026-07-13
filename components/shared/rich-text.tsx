import { cn } from "@/lib/utils"
import { sanitizeRichText } from "@/lib/rich-text"

type RichTextProps = {
  value: string | null | undefined
  fallback?: string
  className?: string
}

export function RichText({ value, fallback, className }: RichTextProps) {
  const html = sanitizeRichText(value)

  if (!html.trim()) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  return (
    <div
      data-slot="rich-text"
      className={cn("min-w-0 max-w-full break-words [overflow-wrap:anywhere] [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
