"use client"
import { Download, FileUp, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useUploadThing } from "@/lib/uploadthing"
import { createChapter, removeChapter, updateChapter } from "../actions"
import type { ProjectChapter } from "../types"

function ChapterPanel({ projectId, chapter, canDelete }: { projectId: string; chapter: ProjectChapter; canDelete: boolean }) {
  const router = useRouter(); const [title, setTitle] = useState(chapter.title); const [content, setContent] = useState(chapter.content); const [pending, startTransition] = useTransition()
  const { startUpload, isUploading } = useUploadThing("chapterDocument", { onClientUploadComplete: () => { toast.success("File imported into the chapter."); router.refresh() }, onUploadError: (error) => { toast.error(error.message) } })
  function save() { startTransition(async () => { const result = await updateChapter({ projectId, chapterId: chapter.id, title, content }); if (result.success) toast.success("Chapter saved."); else toast.error(result.error) }) }
  function remove() { startTransition(async () => { const result = await removeChapter({ projectId, chapterId: chapter.id }); if (result.success) router.refresh(); else toast.error(result.error) }) }
  async function upload(file: File | undefined) { if (!file) return; if (file.size > 16 * 1024 * 1024) { toast.error("File must be 16 MB or smaller."); return }; await startUpload([file], { chapterId: chapter.id }) }
  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="flex-1"><Input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Chapter title" /></CardTitle><div className="flex gap-2"><label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs"><FileUp className="size-3.5" />{isUploading ? "Importing..." : "Import Word/PDF"}<input className="sr-only" type="file" accept=".docx,application/pdf" disabled={isUploading} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = "" }} /></label>{canDelete ? <Button size="sm" variant="ghost" onClick={remove} disabled={pending}><Trash2 /></Button> : null}</div></div></CardHeader><CardContent className="space-y-3"><Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={16} placeholder={`Write ${title.toLowerCase()} here...`} className="resize-y text-sm leading-7" /><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] text-muted-foreground">{content.trim() ? content.trim().split(/\s+/).length : 0} words · {chapter.files.length} files</p><Button size="sm" onClick={save} disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save chapter</Button></div>{chapter.files.length ? <ul className="space-y-1 border-t pt-3">{chapter.files.map((file) => <li key={file.id}><a className="text-xs text-primary hover:underline" href={file.url} target="_blank" rel="noreferrer">{file.name}</a></li>)}</ul> : null}</CardContent></Card>
}

export function ChapterEditor({ projectId, chapters, isOwner }: { projectId: string; chapters: ProjectChapter[]; isOwner: boolean }) {
  const [title, setTitle] = useState(""); const [pending, startTransition] = useTransition(); const router = useRouter()
  function add() { startTransition(async () => { const result = await createChapter({ projectId, title }); if (result.success) { setTitle(""); router.refresh() } else toast.error(result.error) }) }
  return <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold">Research chapters</h2><p className="text-xs text-muted-foreground">Write chapters, import Word/PDF drafts, and export the complete report.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" asChild><a href={`/student/projects/${projectId}/export?format=docx`}><Download /> Word</a></Button><Button size="sm" variant="outline" asChild><a href={`/student/projects/${projectId}/export?format=pdf`}><Download /> PDF</a></Button></div></div>{isOwner ? <div className="flex gap-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Custom chapter name" maxLength={120} /><Button onClick={add} disabled={pending || title.trim().length < 2}><Plus /> Add chapter</Button></div> : null}<div className="space-y-4">{chapters.map((chapter) => <ChapterPanel key={chapter.id} projectId={projectId} chapter={chapter} canDelete={isOwner} />)}</div></section>
}
