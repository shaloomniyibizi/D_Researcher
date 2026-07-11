"use client"

import { FileText, Loader2, MessageSquareText, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { deleteKnowledgeDocument } from "../actions"
import type { KnowledgeDocumentSummary } from "../types"
import { DocumentStatusBadge } from "./document-status-badge"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
}

export function DocumentList({ documents }: { documents: KnowledgeDocumentSummary[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const hasActiveProcessing = documents.some((document) => document.status === "PENDING" || document.status === "PROCESSING")

  useEffect(() => {
    if (!hasActiveProcessing) return

    const interval = setInterval(() => router.refresh(), 3_000)
    return () => clearInterval(interval)
  }, [hasActiveProcessing, router])

  async function handleDelete(documentId: string) {
    setDeletingId(documentId)
    const result = await deleteKnowledgeDocument({ documentId })
    setDeletingId(null)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Document deleted.")
    router.refresh()
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="grid min-h-56 place-items-center text-center">
          <div>
            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </span>
            <h2 className="text-sm font-medium">No documents yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Upload a PDF above to start chatting with it.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <Card key={document.id} className="flex h-full flex-col">
          <CardContent className="flex flex-1 flex-col gap-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </span>
              <DocumentStatusBadge status={document.status} />
            </div>
            <div>
              <h3 className="line-clamp-2 text-sm font-medium">{document.title}</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">Uploaded {formatDate(document.createdAt)}</p>
            </div>
            {document.status === "FAILED" && document.errorMessage ? (
              <p className="line-clamp-2 text-[11px] text-destructive">{document.errorMessage}</p>
            ) : null}
            {document.status === "EMPTY" ? (
              <p className="text-[11px] text-muted-foreground">
                No readable text was found. This may be a scanned PDF; OCR isn&apos;t supported yet.
              </p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
              {document.status === "INDEXED" ? (
                <Button size="sm" asChild>
                  <Link href={`/student/documents/${document.id}`}>
                    <MessageSquareText /> Chat
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  {document.status === "PROCESSING" || document.status === "PENDING" ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  {document.status === "PROCESSING" || document.status === "PENDING" ? "Processing..." : "Unavailable"}
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label={`Delete ${document.title}`}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete this document?</DialogTitle>
                    <DialogDescription>
                      This removes &ldquo;{document.title}&rdquo; and its chat history. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      disabled={deletingId === document.id}
                      onClick={() => handleDelete(document.id)}
                    >
                      {deletingId === document.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
