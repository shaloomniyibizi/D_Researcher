"use client"

import {
  Bot,
  ExternalLink,
  FilePlus2,
  FileText,
  Loader2,
  MessageSquareText,
  PanelLeft,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"
import { toast } from "react-toastify"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { sendDocumentChatMessage } from "../actions"
import type { DocumentChatData, DocumentChatMessage } from "../types"
import { CitationList } from "./citation-list"
import { DocumentStatusBadge } from "./document-status-badge"

const STARTERS = [
  "Summarize the key findings",
  "What methodology is used?",
  "What limitations are discussed?",
  "List the main contributions",
] as const

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

function formatSize(bytes: number): string {
  if (bytes < 1_048_576) return `${Math.max(1, Math.round(bytes / 1_024))} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

export function DocumentChat({ data, configured }: { data: DocumentChatData; configured: boolean }) {
  const pendingId = useRef(0)
  const [messages, setMessages] = useState(data.messages)
  const [prompt, setPrompt] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [mobilePane, setMobilePane] = useState<"document" | "chat">("chat")

  async function submitMessage(value = prompt) {
    const content = value.trim()
    if (!content || isPending || !configured) return

    const optimistic: DocumentChatMessage = {
      id: `pending-${++pendingId.current}`,
      role: "user",
      content,
      citations: null,
      createdAt: new Date(),
    }
    setMessages((current) => [...current, optimistic])
    setPrompt("")
    setIsPending(true)

    const result = await sendDocumentChatMessage({ documentId: data.document.id, prompt: content })
    setIsPending(false)

    if (!result.success) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id))
      setPrompt(content)
      toast.error(result.error)
      return
    }

    setMessages((current) => [...current, result.data.message])
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] min-h-[34rem] flex-col overflow-hidden bg-muted/20">
      <div className="grid h-12 shrink-0 grid-cols-2 border-b bg-background p-1 md:hidden">
        <button
          type="button"
          onClick={() => setMobilePane("document")}
          className={cn("flex items-center justify-center gap-2 rounded-md text-xs", mobilePane === "document" && "bg-muted font-medium")}
        >
          <FileText className="size-4" /> Document
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("chat")}
          className={cn("flex items-center justify-center gap-2 rounded-md text-xs", mobilePane === "chat" && "bg-muted font-medium")}
        >
          <MessageSquareText className="size-4" /> Chat
        </button>
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-0 border-r bg-card xl:flex xl:flex-col">
          <div className="border-b p-3">
            <Button className="w-full" size="sm" asChild>
              <Link href="/student/documents"><FilePlus2 /> New PDF chat</Link>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <p className="px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your documents</p>
            <nav className="space-y-1" aria-label="PDF documents">
              {data.documents.map((document) => {
                const active = document.id === data.document.id
                const ready = document.status === "INDEXED"

                return ready ? (
                  <Link
                    key={document.id}
                    href={`/student/documents/${document.id}`}
                    className={cn("flex items-start gap-2 rounded-md px-3 py-2.5 transition-colors hover:bg-muted", active && "bg-primary text-primary-foreground hover:bg-primary")}
                    aria-current={active ? "page" : undefined}
                  >
                    <MessageSquareText className="mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0"><span className="block truncate text-xs font-medium">{document.title}</span><span className={cn("mt-0.5 block text-[9px] text-muted-foreground", active && "text-primary-foreground/70")}>{document.tokenCount.toLocaleString()} tokens</span></span>
                  </Link>
                ) : (
                  <div key={document.id} className="flex items-start gap-2 rounded-md px-3 py-2.5 opacity-65">
                    <FileText className="mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0"><span className="block truncate text-xs">{document.title}</span><span className="mt-1 block"><DocumentStatusBadge status={document.status} /></span></span>
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        <section className={cn("min-h-0 min-w-0 flex-col bg-muted/40", mobilePane === "document" ? "flex" : "hidden", "md:flex")}>
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
            <div className="flex min-w-0 items-center gap-2">
              <PanelLeft className="hidden size-4 text-muted-foreground xl:block" />
              <div className="min-w-0"><h1 className="truncate text-xs font-semibold">{data.document.title}</h1><p className="text-[9px] text-muted-foreground">{data.document.uploadedFile ? formatSize(data.document.uploadedFile.sizeBytes) : "PDF document"}</p></div>
            </div>
            {data.document.uploadedFile ? (
              <Button variant="outline" size="icon-sm" asChild>
                <a href={data.document.uploadedFile.url} target="_blank" rel="noreferrer" aria-label="Open PDF in a new tab"><ExternalLink /></a>
              </Button>
            ) : null}
          </header>
          <div className="min-h-0 flex-1 p-2 sm:p-3">
            {data.document.uploadedFile ? (
              <iframe
                src={`${data.document.uploadedFile.url}#toolbar=1&navpanes=0&view=FitH`}
                title={`${data.document.title} PDF viewer`}
                className="h-full w-full border bg-background shadow-sm"
              />
            ) : (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">The PDF file is unavailable.</div>
            )}
          </div>
        </section>

        <section className={cn("min-h-0 min-w-0 flex-col border-l bg-background", mobilePane === "chat" ? "flex" : "hidden", "md:flex")}>
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="size-4" /></span>
            <div><h2 className="text-sm font-semibold">Chat</h2><p className="text-[9px] text-muted-foreground">Grounded in this PDF</p></div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="grid min-h-[55vh] place-items-center text-center">
                  <div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-5" /></span><h3 className="mt-3 text-sm font-semibold">Ask this PDF anything</h3><p className="mx-auto mt-1 max-w-xs text-[10px] leading-5 text-muted-foreground">Answers use only retrieved passages from this document.</p><div className="mt-4 grid gap-2">{STARTERS.map((starter) => <button key={starter} type="button" disabled={!configured} onClick={() => submitMessage(starter)} className="rounded-md border bg-card px-3 py-2 text-left text-[10px] hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50">{starter}</button>)}</div></div>
                </div>
              ) : (
                messages.map((message) => (
                  <article key={message.id} className={cn("flex items-start gap-2", message.role === "user" && "flex-row-reverse")}>
                    <Avatar size="sm" className={message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}><AvatarFallback>{message.role === "assistant" ? <Bot className="size-3.5" /> : <UserRound className="size-3.5" />}</AvatarFallback></Avatar>
                    <div className={cn("max-w-[85%] rounded-lg px-3 py-2", message.role === "assistant" ? "border bg-card" : "bg-primary text-primary-foreground")}>
                      <p className="whitespace-pre-wrap text-[11px] leading-5">{message.content}</p>
                      {message.role === "assistant" && message.citations ? <CitationList citations={message.citations} /> : null}
                      <time className={cn("mt-1.5 block text-[8px]", message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70")}>{formatTime(message.createdAt)}</time>
                    </div>
                  </article>
                ))
              )}
              {isPending ? <div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="size-3" /></span><div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-[10px] text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Reading the PDF...</div></div> : null}
            </div>
          </div>

          <footer className="shrink-0 border-t p-3">
            {!configured ? <div className="mb-2 rounded-md border border-accent/40 bg-accent/10 px-2 py-1.5 text-[9px]">Add GEMINI_API_KEY and PINECONE_API_KEY to enable chat.</div> : null}
            <div className="flex items-end gap-2 border-b focus-within:border-primary">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitMessage() } }}
                rows={2}
                disabled={!configured || isPending}
                placeholder="Ask any question..."
                className="min-h-10 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
              <Button type="button" size="icon-sm" className="mb-1" disabled={!configured || isPending || prompt.trim().length < 2} onClick={() => submitMessage()} aria-label="Send message">{isPending ? <Loader2 className="animate-spin" /> : <Send />}</Button>
            </div>
            <p className="mt-1.5 text-center text-[8px] text-muted-foreground">Verify important claims against the cited passages.</p>
          </footer>
        </section>
      </div>
    </div>
  )
}
