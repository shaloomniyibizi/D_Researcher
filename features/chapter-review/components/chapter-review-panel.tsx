"use client"

import { CheckCircle2, MessageSquareText, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "react-toastify"

import { RichText } from "@/components/shared/rich-text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { addChapterReviewComment, approveChapterReview } from "../actions"
import type { SupervisorChapterReview } from "../types"

function statusLabel(status: SupervisorChapterReview["status"]): string {
  return status.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())
}

export function ChapterReviewPanel({ projectId, chapters }: { projectId: string; chapters: SupervisorChapterReview[] }) {
  const router = useRouter()
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState("")
  const [body, setBody] = useState("")
  const [pending, startTransition] = useTransition()

  function captureSelection(chapterId: string) {
    const selection = window.getSelection()?.toString().replace(/\s+/g, " ").trim().slice(0, 500) ?? ""
    if (selection) {
      setSelectedChapterId(chapterId)
      setSelectedText(selection)
    }
  }

  function comment(chapterId: string) {
    startTransition(async () => {
      const result = await addChapterReviewComment({ projectId, chapterId, body, selectionText: selectedChapterId === chapterId && selectedText ? selectedText : null })
      if (!result.success) { toast.error(result.error); return }
      setBody("")
      setSelectedText("")
      setSelectedChapterId(null)
      toast.success("Chapter feedback added.")
      router.refresh()
    })
  }

  function approve(chapterId: string) {
    startTransition(async () => {
      const result = await approveChapterReview({ projectId, chapterId })
      if (!result.success) { toast.error(result.error); return }
      toast.success("Chapter approved.")
      router.refresh()
    })
  }

  if (chapters.length === 0) return <Card><CardContent className="py-12 text-center text-xs text-muted-foreground">No chapters have been added yet.</CardContent></Card>

  return <section className="space-y-4"><div><h2 className="font-heading text-xl font-semibold">Chapter review</h2><p className="text-xs text-muted-foreground">Select text inside a chapter to anchor an inline change request. Chapters with unresolved comments cannot be approved.</p></div>{chapters.map((chapter) => { const unresolved = chapter.comments.filter((comment) => !comment.resolvedAt).length; return <Card key={chapter.id} className="min-w-0"><CardHeader className="border-b"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{chapter.title}</CardTitle><CardDescription>{chapter.wordCount.toLocaleString()} words · Updated {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(chapter.updatedAt)}</CardDescription></div><span className={cn("rounded-full px-2 py-1 text-[10px]", chapter.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{statusLabel(chapter.status)}</span></div></CardHeader><CardContent className="min-w-0 space-y-4"><div onMouseUp={() => captureSelection(chapter.id)} className="rounded-md border bg-background p-4"><RichText value={chapter.content} fallback="This chapter has no content yet." className="text-sm leading-7" /></div>{selectedChapterId === chapter.id && selectedText ? <blockquote className="border-l-2 border-primary bg-primary/5 p-3 text-xs"><p className="mb-1 text-[10px] font-medium uppercase text-primary">Selected passage</p>“{selectedText}”</blockquote> : null}<div className="space-y-2"><Textarea value={selectedChapterId === chapter.id ? body : ""} onChange={(event) => { setSelectedChapterId(chapter.id); setBody(event.target.value) }} placeholder="Describe what should change…" maxLength={2_000} rows={3} disabled={pending} /><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground"><MessageSquareText className="mr-1 inline size-3" />{unresolved} unresolved comment{unresolved === 1 ? "" : "s"}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => comment(chapter.id)} disabled={pending || selectedChapterId !== chapter.id || body.trim().length < 2}><Send /> Request change</Button><Button type="button" size="sm" onClick={() => approve(chapter.id)} disabled={pending || chapter.wordCount === 0 || unresolved > 0 || chapter.status === "APPROVED"}><CheckCircle2 /> Approve chapter</Button></div></div></div>{chapter.comments.length ? <div className="space-y-2 border-t pt-4">{chapter.comments.map((comment) => <article key={comment.id} className={cn("rounded-md border p-3", comment.resolvedAt && "opacity-60")} >{comment.selectionText ? <blockquote className="mb-2 border-l-2 pl-2 text-[11px] text-muted-foreground">“{comment.selectionText}”</blockquote> : null}<p className="text-xs">{comment.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{comment.author.name} · {comment.resolvedAt ? "Resolved" : "Changes requested"}</p></article>)}</div> : null}</CardContent></Card> })}</section>
}
