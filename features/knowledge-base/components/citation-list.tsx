"use client"

import { Quote } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

import type { DocumentChatCitation } from "../types"

export function CitationList({ citations }: { citations: DocumentChatCitation[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (citations.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((citation, index) => {
        const isExpanded = expandedId === citation.chunkId

        return (
          <button
            key={citation.chunkId}
            type="button"
            onClick={() => setExpandedId(isExpanded ? null : citation.chunkId)}
            className={cn(
              "inline-flex max-w-full items-start gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-left text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
              isExpanded && "border-primary/40 text-foreground",
            )}
          >
            <Quote className="mt-0.5 size-3 shrink-0" />
            <span className={cn(isExpanded ? "whitespace-pre-wrap" : "line-clamp-1")}>
              [{index + 1}] {citation.snippet}
            </span>
          </button>
        )
      })}
    </div>
  )
}
