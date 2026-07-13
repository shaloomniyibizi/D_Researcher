"use client"

import { Download, FileUp, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "react-toastify"

import { RichTextEditor } from "@/components/shared/rich-text-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StudentChapterComments } from "@/features/chapter-review/components/student-chapter-comments"
import { useUploadThing } from "@/lib/uploadthing"

import { createChapter, removeChapter, updateChapter } from "../actions"
import type { ProjectChapter } from "../types"

function editorText(value: string): string {
  return value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim()
}

function ChapterPanel({ projectId, chapter, canDelete }: { projectId: string; chapter: ProjectChapter; canDelete: boolean }) {
  const router = useRouter()
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)
  const [pending, startTransition] = useTransition()
  const { startUpload, isUploading } = useUploadThing("chapterDocument", {
    onClientUploadComplete: () => { toast.success("File imported into the chapter."); router.refresh() },
    onUploadError: (error) => { toast.error(error.message) },
  })

  function save() {
    startTransition(async () => {
      const result = await updateChapter({ projectId, chapterId: chapter.id, title, content })
      if (!result.success) { toast.error(result.error); return }
      toast.success("Chapter saved and sent for review.")
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await removeChapter({ projectId, chapterId: chapter.id })
      if (!result.success) { toast.error(result.error); return }
      router.refresh()
    })
  }

  async function upload(file: File | undefined) {
    if (!file) return
    if (file.size > 16 * 1024 * 1024) { toast.error("File must be 16 MB or smaller."); return }
    await startUpload([file], { chapterId: chapter.id })
  }

  const plainContent = editorText(content)
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="min-w-0 flex-1"><Input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Chapter title" /></CardTitle>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs"><FileUp className="size-3.5" />{isUploading ? "Importing..." : "Import Word/PDF"}<input className="sr-only" type="file" accept=".docx,application/pdf" disabled={isUploading} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = "" }} /></label>
            {canDelete ? <Button size="sm" variant="ghost" onClick={remove} disabled={pending} aria-label={`Delete ${title}`}><Trash2 /></Button> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        <RichTextEditor value={content} onChange={setContent} placeholder={`Write ${title.toLowerCase()} here...`} disabled={pending} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">{plainContent ? plainContent.split(/\s+/).length : 0} words · {chapter.files.length} files · {chapter.status.toLowerCase().replaceAll("_", " ")}</p>
          <Button size="sm" onClick={save} disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save chapter</Button>
        </div>
        {chapter.files.length ? <ul className="space-y-1 border-t pt-3">{chapter.files.map((file) => <li key={file.id}><a className="block truncate text-xs text-primary hover:underline" href={file.url} target="_blank" rel="noreferrer">{file.name}</a></li>)}</ul> : null}
        <StudentChapterComments projectId={projectId} chapterId={chapter.id} comments={chapter.comments} />
      </CardContent>
    </Card>
  )
}

export function ChapterEditor({ projectId, chapters, isOwner }: { projectId: string; chapters: ProjectChapter[]; isOwner: boolean }) {
  const [title, setTitle] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const approvedChapters = chapters.filter((chapter) => chapter.status === "APPROVED" || chapter.status === "PUBLISHED").length
  const totalWords = chapters.reduce((total, chapter) => total + chapter.wordCount, 0)
  const progress = chapters.length ? Math.round((approvedChapters / chapters.length) * 100) : 0

  function add() {
    startTransition(async () => {
      const result = await createChapter({ projectId, title })
      if (!result.success) { toast.error(result.error); return }
      setTitle("")
      router.refresh()
    })
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold">Research chapters</h2><p className="text-xs text-muted-foreground">Write chapters, address supervisor comments, and track approvals.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" asChild><a href={`/student/projects/${projectId}/export?format=docx`}><Download /> Word</a></Button><Button size="sm" variant="outline" asChild><a href={`/student/projects/${projectId}/export?format=pdf`}><Download /> PDF</a></Button></div></div>
      <Card size="sm"><CardContent className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium">Approved chapter progress</p><p className="text-[11px] text-muted-foreground">{approvedChapters} of {chapters.length} chapters approved · {totalWords.toLocaleString()} words</p></div><span className="font-heading text-lg font-semibold text-primary">{progress}%</span></div><progress value={progress} max={100} aria-label="Approved chapter progress" className="h-2 w-full accent-primary" /></CardContent></Card>
      {isOwner ? <div className="flex gap-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Custom chapter name" maxLength={120} /><Button onClick={add} disabled={pending || title.trim().length < 2}><Plus /> Add chapter</Button></div> : null}
      <div className="space-y-4">{chapters.map((chapter) => <ChapterPanel key={`${chapter.id}-${new Date(chapter.updatedAt).getTime()}`} projectId={projectId} chapter={chapter} canDelete={isOwner} />)}</div>
    </section>
  )
}
