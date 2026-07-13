import { ArrowLeft, History, MessageSquareText } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RichText } from "@/components/shared/rich-text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangeFeedbackForm } from "@/features/project-review/components/change-feedback-form"
import { ChapterReviewPanel } from "@/features/chapter-review/components/chapter-review-panel"
import { getSupervisorChapterReviews } from "@/features/chapter-review/repositories/chapter-review-repository"
import { getSupervisorProjectReview } from "@/features/project-review/repositories/project-review-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

function label(value: string) { return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) }
function DisplayValue({ value, emphasized = false }: { value: unknown; emphasized?: boolean }) { if (value === null || value === undefined || value === "") return <span>Not provided</span>; if (Array.isArray(value)) return <span>{value.join(", ") || "None"}</span>; return <RichText value={String(value)} className={emphasized ? "font-medium" : undefined} /> }
function display(value: unknown): string { if (value === null || value === undefined || value === "") return "Not provided"; if (Array.isArray(value)) return value.join(", ") || "None"; return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() }
function formatDate(value: Date) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(value) }

export default async function SupervisorProjectReviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(await headers())
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.SUPERVISOR) notFound()
  const { projectId } = await params
  const data = await getSupervisorProjectReview(session.user.id, projectId)
  if (!data) notFound()
  const chapters = await getSupervisorChapterReviews(session.user.id, projectId)
  if (!chapters) notFound()
  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8"><div><Button variant="ghost" size="sm" className="mb-3" asChild><Link href="/supervisor"><ArrowLeft />Dashboard</Link></Button><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-xs font-medium text-primary">Project review</p><h1 className="mt-1 font-heading text-2xl font-semibold">{data.project.title}</h1><div className="mt-2 flex items-center gap-2"><Avatar size="sm">{data.project.owner.image ? <AvatarImage src={data.project.owner.image} alt={data.project.owner.name} /> : null}<AvatarFallback>{data.project.owner.name[0]}</AvatarFallback></Avatar><p className="text-xs text-muted-foreground">{data.project.owner.name}{data.project.owner.studentNumber ? ` · ${data.project.owner.studentNumber}` : ""}</p></div></div><Button asChild><Link href={`/supervisor/chat/${projectId}`}><MessageSquareText />Open chat</Link></Button></div></div>
    <Card><CardHeader><CardTitle>Current project information</CardTitle><CardDescription>The latest version submitted by the student.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{[["Problem statement", data.project.problemStatement], ["Abstract", data.project.abstract], ["Objectives", data.project.objectives], ["Keywords", data.project.keywords]].map(([name, value]) => <div key={String(name)} className="min-w-0"><p className="text-[10px] font-medium uppercase text-muted-foreground">{String(name)}</p><div className="mt-1 text-xs leading-relaxed"><DisplayValue value={value} /></div></div>)}</CardContent></Card>
    <ChapterReviewPanel projectId={projectId} chapters={chapters} />
    <Card><CardHeader className="border-b"><CardTitle>Change history</CardTitle><CardDescription>Every tracked edit, with feedback attached to the exact revision.</CardDescription></CardHeader><CardContent className="p-0">{data.activity.length === 0 ? <div className="grid min-h-56 place-items-center text-center"><div><History className="mx-auto size-7 text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">No tracked changes yet.</p></div></div> : <ol className="divide-y">{data.activity.map((activity) => <li key={activity.id} className="p-4 sm:p-6"><div className="flex items-center gap-2"><Avatar size="sm">{activity.actor?.image ? <AvatarImage src={activity.actor.image} alt={activity.actor.name} /> : null}<AvatarFallback>{activity.actor?.name[0] ?? "S"}</AvatarFallback></Avatar><div><p className="text-xs font-medium">{activity.actor?.name ?? "Student"} {activity.action === "project.created" ? "created the project" : "updated the project"}</p><time className="text-[10px] text-muted-foreground">{formatDate(activity.createdAt)}</time></div></div>{activity.changes.length > 0 ? <div className="mt-4 space-y-3">{activity.changes.map((change) => <div key={change.field} className="rounded-md border bg-muted/20 p-3"><p className="mb-2 text-[10px] font-semibold uppercase text-primary">{label(change.field)}</p><div className="grid gap-3 text-[11px] md:grid-cols-2"><div><span className="text-muted-foreground">Before</span><p className="mt-1 line-clamp-4">{display(change.before)}</p></div><div><span className="text-muted-foreground">After</span><p className="mt-1 line-clamp-4 font-medium">{display(change.after)}</p></div></div></div>)}</div> : null}{activity.feedback.length > 0 ? <div className="mt-4 space-y-2">{activity.feedback.map((feedback) => <div key={feedback.id} className="rounded-md border-l-2 border-l-primary bg-primary/5 p-3"><p className="text-[10px] font-medium">{feedback.author.name} · {formatDate(feedback.createdAt)}</p><p className="mt-1 whitespace-pre-wrap text-xs">{feedback.body}</p></div>)}</div> : null}<ChangeFeedbackForm projectId={projectId} activityLogId={activity.id} /></li>)}</ol>}</CardContent></Card>
  </main>
}
