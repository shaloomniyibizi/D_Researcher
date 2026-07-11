"use client"

import { FileUp, Loader2, UploadCloud } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing"

const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024

export function DocumentUpload({ configured }: { configured: boolean }) {
  const router = useRouter()

  const { startUpload, isUploading } = useUploadThing("knowledgeDocument", {
    onClientUploadComplete: () => {
      toast.success("Document uploaded. Processing will finish shortly.")
      router.refresh()
    },
    onUploadError: (error) => {
      toast.error(error.message || "Could not upload this document.")
    },
  })

  async function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Choose a PDF file.")
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("PDF must be 16 MB or smaller.")
      return
    }

    await startUpload([file])
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="size-5" />
      </span>
      <h2 className="mt-3 text-sm font-medium">Upload a PDF to chat with it</h2>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        Upload a research paper, thesis, or report and ask questions answered directly from its content.
      </p>
      <label
        htmlFor="knowledgeDocument"
        className={cn(
          "mt-4 inline-flex h-9 cursor-pointer items-center gap-2 border border-input bg-background px-4 text-xs font-medium hover:bg-muted",
          (isUploading || !configured) && "pointer-events-none opacity-50",
        )}
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        {isUploading ? "Uploading..." : "Choose PDF"}
      </label>
      <Input
        id="knowledgeDocument"
        type="file"
        accept="application/pdf"
        className="sr-only"
        disabled={isUploading || !configured}
        onChange={handleFileSelection}
      />
      {!configured ? (
        <p className="mx-auto mt-3 max-w-sm text-[11px] text-destructive">
          Document chat is not configured on this server yet. Add PINECONE_API_KEY and GEMINI_API_KEY.
        </p>
      ) : (
        <p className="mt-3 text-[10px] text-muted-foreground">PDF only. Maximum 16 MB.</p>
      )}
    </div>
  )
}
