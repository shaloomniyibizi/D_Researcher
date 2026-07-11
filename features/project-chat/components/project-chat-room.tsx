"use client"

import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState, useTransition } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { sendProjectChatMessage } from "../actions"
import type { ProjectChatData } from "../types"

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function ProjectChatRoom({
  data,
  currentUserId,
  basePath,
}: {
  data: ProjectChatData
  currentUserId: string
  basePath: "/student/chat" | "/supervisor/chat"
}) {
  const router = useRouter()
  const endRef = useRef<HTMLDivElement>(null)
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data.messages])
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, 15_000)
    return () => window.clearInterval(interval)
  }, [router])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim() || isPending) return
    const messageBody = body.trim()
    setError(null)

    startTransition(async () => {
      const result = await sendProjectChatMessage({ projectId: data.room.id, body: messageBody })
      if (!result.success) {
        setError(result.error)
        return
      }
      setBody("")
      router.refresh()
    })
  }

  return (
    <section className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border bg-card">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={basePath} aria-label="Back to conversations"><ArrowLeft /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{data.room.title}</h1>
          <p className="text-[11px] text-muted-foreground">Project supervision room</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {data.messages.length === 0 ? (
          <div className="grid min-h-72 place-items-center text-center">
            <div><p className="text-sm font-medium">Start the conversation</p><p className="mt-1 text-xs text-muted-foreground">Discuss progress, questions, and supervisor feedback here.</p></div>
          </div>
        ) : data.messages.map((message) => {
          const own = message.author.id === currentUserId
          return (
            <article key={message.id} className={cn("flex max-w-2xl gap-2", own && "ml-auto flex-row-reverse")}>
              <Avatar size="sm">
                {message.author.image ? <AvatarImage src={message.author.image} alt={message.author.name} /> : null}
                <AvatarFallback>{message.author.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={cn("min-w-0", own && "text-right")}>
                <div className="mb-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">{own ? "You" : message.author.name}</span>
                  <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time>
                </div>
                <p className={cn("whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-left text-xs leading-relaxed", own ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted")}>{message.body}</p>
              </div>
            </article>
          )
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2_000} rows={2} placeholder="Write a message…" disabled={isPending} className="min-h-16 resize-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
          <Button type="submit" size="icon" disabled={!body.trim() || isPending} aria-label="Send message"><Send /></Button>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span className="text-destructive">{error}</span><span>{body.length}/2000</span></div>
      </form>
    </section>
  )
}
