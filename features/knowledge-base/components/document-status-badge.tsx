import { cn } from "@/lib/utils"

import type { KnowledgeDocumentStatusValue } from "../types"

const STATUS_LABELS: Record<KnowledgeDocumentStatusValue, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  INDEXED: "Ready",
  FAILED: "Failed",
  EMPTY: "No text found",
}

const STATUS_CLASSES: Record<KnowledgeDocumentStatusValue, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PROCESSING: "bg-accent/10 text-accent-foreground",
  INDEXED: "bg-primary/10 text-primary",
  FAILED: "bg-destructive/10 text-destructive",
  EMPTY: "bg-muted text-muted-foreground",
}

export function DocumentStatusBadge({ status }: { status: KnowledgeDocumentStatusValue }) {
  return (
    <span className={cn("rounded-full px-2 py-1 text-[10px] font-medium", STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}
