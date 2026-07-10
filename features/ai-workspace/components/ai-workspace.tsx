"use client"

import { Bot, FolderKanban, History, Loader2, MessageSquarePlus, Send, Sparkles, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "react-toastify"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { sendAiMessage } from "../actions"
import type { AiWorkspaceData, AiWorkspaceMessage } from "../types"

const STARTERS = [
  "Help me refine my research problem",
  "Review my objectives for clarity and measurability",
  "Suggest a suitable methodology for this project",
  "Identify risks and limitations I should address",
] as const

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date))
}

export function AiWorkspace({ data, configured }: { data: AiWorkspaceData; configured: boolean }) {
  const router = useRouter()
  const pendingId = useRef(0)
  const [messages, setMessages] = useState(data.messages)
  const [conversationId, setConversationId] = useState(data.activeConversation?.id ?? null)
  const [projectId, setProjectId] = useState(data.activeConversation?.project?.id ?? "")
  const [prompt, setPrompt] = useState("")
  const [isPending, setIsPending] = useState(false)

  async function submitMessage(value = prompt) {
    const content = value.trim()
    if (!content || isPending || !configured) return

    const optimistic: AiWorkspaceMessage = {
      id: `pending-${++pendingId.current}`,
      role: "user",
      content,
      createdAt: new Date(),
    }
    setMessages((current) => [...current, optimistic])
    setPrompt("")
    setIsPending(true)

    const result = await sendAiMessage({
      conversationId,
      projectId: conversationId ? null : projectId || null,
      prompt: content,
    })
    setIsPending(false)

    if (!result.success) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id))
      setPrompt(content)
      toast.error(result.error)
      return
    }

    setConversationId(result.data.conversationId)
    setMessages((current) => [...current, result.data.message])
    router.replace(`/student/ai?conversation=${result.data.conversationId}`, { scroll: false })
    router.refresh()
  }

  return (
    <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden border-r bg-card lg:flex lg:flex-col">
        <div className="border-b p-3">
          <Button className="w-full" asChild>
            <Link href="/student/ai?new=1"><MessageSquarePlus /> New conversation</Link>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Recent conversations</p>
          {data.conversations.length === 0 ? (
            <div className="px-3 py-8 text-center"><History className="mx-auto size-5 text-muted-foreground" /><p className="mt-2 text-[11px] text-muted-foreground">Your conversations will appear here.</p></div>
          ) : (
            <nav className="space-y-1" aria-label="AI conversations">
              {data.conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/student/ai?conversation=${conversation.id}`}
                  className={cn("block rounded-md px-3 py-2.5 hover:bg-muted", conversation.id === conversationId && "bg-muted")}
                >
                  <p className="truncate text-xs font-medium">{conversation.title}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{conversation.project?.title ?? "General research"}</p>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-col">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="size-5" /></span><div><h1 className="font-heading text-sm font-semibold">Researcher AI</h1><p className="text-[10px] text-muted-foreground">Academic guidance grounded in your project context</p></div></div>
          <Button variant="outline" size="sm" className="lg:hidden" asChild><Link href="/student/ai?new=1"><MessageSquarePlus /> New chat</Link></Button>
          {!conversationId ? (
            <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <FolderKanban className="size-3.5" />
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-8 max-w-52 border border-input bg-background px-2 text-xs text-foreground outline-none focus:border-ring">
                <option value="">General research</option>
                {data.projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
            </label>
          ) : data.activeConversation?.project ? <span className="max-w-56 truncate rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">{data.activeConversation.project.title}</span> : null}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 0 ? (
              <div className="grid min-h-[55vh] place-items-center text-center">
                <div className="max-w-xl"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-6" /></span><h2 className="mt-4 font-heading text-xl font-semibold">How can I support your research?</h2><p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted-foreground">Ask about research questions, proposals, methodology, literature strategy, implementation planning, or defense preparation.</p><div className="mt-6 grid gap-2 sm:grid-cols-2">{STARTERS.map((starter) => <button key={starter} type="button" disabled={!configured} onClick={() => submitMessage(starter)} className="rounded-lg border bg-card p-3 text-left text-xs leading-5 transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50">{starter}</button>)}</div></div>
              </div>
            ) : (
              messages.map((message) => (
                <article key={message.id} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
                  <Avatar className={cn("mt-1", message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted")}><AvatarFallback>{message.role === "assistant" ? <Bot className="size-4" /> : <UserRound className="size-4" />}</AvatarFallback></Avatar>
                  <div className={cn("max-w-[85%] rounded-xl px-4 py-3", message.role === "assistant" ? "border bg-card" : "bg-primary text-primary-foreground")}><p className="whitespace-pre-wrap text-xs leading-6">{message.content}</p><time className={cn("mt-2 block text-[9px]", message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70")}>{formatTime(message.createdAt)}</time></div>
                </article>
              ))
            )}
            {isPending ? <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="size-4" /></span><div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Analyzing your research...</div></div> : null}
          </div>
        </div>

        <footer className="border-t bg-background p-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {!configured ? <div className="mb-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-[11px] text-foreground">AI responses are disabled. Add <code className="font-mono">GEMINI_API_KEY</code> to the server environment and restart the app.</div> : null}
            <div className="flex items-end gap-2 rounded-xl border bg-card p-2 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30">
              <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitMessage() } }} rows={2} disabled={!configured || isPending} placeholder="Ask about your research..." className="min-h-12 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
              <Button type="button" size="icon" disabled={!configured || isPending || prompt.trim().length < 2} onClick={() => submitMessage()} aria-label="Send message">{isPending ? <Loader2 className="animate-spin" /> : <Send />}</Button>
            </div>
            <p className="mt-2 text-center text-[9px] text-muted-foreground">AI can make mistakes. Verify important claims and never cite a source you have not read.</p>
          </div>
        </footer>
      </section>
    </div>
  )
}
