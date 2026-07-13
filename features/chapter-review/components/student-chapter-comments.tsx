"use client"

import { Check, Quote } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { resolveChapterReviewComment } from "../actions"
import type { ChapterReviewComment } from "../types"

export function StudentChapterComments({ projectId, chapterId, comments }: { projectId: string; chapterId: string; comments: ChapterReviewComment[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  if (comments.length === 0) return null

  function resolve(commentId: string) {
    startTransition(async () => {
      const result = await resolveChapterReviewComment({ projectId, chapterId, commentId })
      if (!result.success) { toast.error(result.error); return }
      toast.success("Comment marked as addressed.")
      router.refresh()
    })
  }

  return <section className="space-y-2 border-t pt-3"><h3 className="text-xs font-medium">Supervisor chapter feedback</h3>{comments.map((comment) => <article key={comment.id} className={cn("rounded-md border p-3", comment.resolvedAt && "opacity-60")} >{comment.selectionText ? <blockquote className="mb-2 border-l-2 border-primary pl-2 text-[11px] text-muted-foreground"><Quote className="mr-1 inline size-3" />{comment.selectionText}</blockquote> : null}<p className="text-xs">{comment.body}</p><div className="mt-2 flex items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">{comment.author.name} · {comment.resolvedAt ? "Addressed" : "Change requested"}</p>{!comment.resolvedAt ? <Button type="button" size="sm" variant="outline" onClick={() => resolve(comment.id)} disabled={pending}><Check /> Mark addressed</Button> : null}</div></article>)}</section>
}
