import { ArrowLeft, BookOpenText, CalendarDays, CheckCircle2, FilePenLine, FileText, ListChecks, Users } from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RichText } from "@/components/shared/rich-text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStudentProjectDetails } from "@/features/projects/repositories/project-repository"
import { ChapterEditor } from "@/features/chapters/components/chapter-editor"
import { getProjectChapters } from "@/features/chapters/repositories/chapter-repository"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Project Overview | Researcher" }

function label(value: string): string {
  return value.toLowerCase().split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
}
function date(value: Date | null): string { return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value) : "No date" }
export default async function StudentProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  const { projectId } = await params
  const project = await getStudentProjectDetails(session.user.id, projectId)
  if (!project) notFound()
  const chapters = await getProjectChapters(session.user.id, projectId)
  if (!chapters) notFound()

  return (
    <main className="mx-auto w-full max-w-375 space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3"><Button variant="ghost" size="sm" asChild><Link href="/student/projects"><ArrowLeft /> All projects</Link></Button>{project.owner.id === session.user.id && project.status !== "DEFENDED" && project.status !== "ARCHIVED" ? <Button variant="outline" size="sm" asChild><Link href={`/student/projects/${project.id}/edit`}><FilePenLine /> Edit project</Link></Button> : null}</div>
      <header className="min-w-0 overflow-hidden rounded-lg border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
            {label(project.status)}
          </span>
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            {label(project.visibility)}
          </span>
        </div>
        <h1 className="mt-4 max-w-4xl break-words font-heading text-2xl font-semibold [overflow-wrap:anywhere] sm:text-3xl">{project.title}</h1>
        <RichText value={project.abstract} className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground" />
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <span>{project.department.institution.name}</span>
          <span>{project.department.name} ({project.department.code})</span>
          <span>Started {date(project.startedAt)}</span>
        </div>
        {project.keywords.length ?
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.keywords.map((keyword) =>
              <span key={keyword} className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">{keyword}</span>)}</div> : null}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: FileText, count: project.counts.documents, label: "Documents" },
          { icon: BookOpenText, count: project.counts.sources, label: "Literature sources" },
          { icon: CheckCircle2, count: project.counts.submissions, label: "Submissions" },
          { icon: Users, count: project.members.length + 1, label: "Project members" }
        ].map((metric) =>
          <Card key={metric.label} size="sm">
            <CardContent className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                <metric.icon className="size-4" />
              </span>
              <div>
                <p className="font-heading text-xl font-semibold">{metric.count}</p>
                <p className="text-[10px] text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>)}
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Research foundation</CardTitle>
              <CardDescription>The problem and objectives guiding this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-1">
              <div>
                <h2 className="text-xs font-medium">Problem statement</h2>
                <RichText value={project.problemStatement} className="mt-2 text-sm leading-7 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xs font-medium">Objectives</h2>
                {project.objectives.length ? (
                  <ol className="mt-2 space-y-2">
                    {project.objectives.map((objective, index) => (
                      <li key={objective} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                          {index + 1}
                        </span>
                        {objective}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No objectives added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
          <ChapterEditor projectId={project.id} chapters={chapters} isOwner={project.owner.id === session.user.id} />
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Milestones</CardTitle>
              <CardDescription>Research stages and approval checkpoints.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {project.milestones.length ? (
                <ol className="divide-y">
                  {project.milestones.map((milestone) => (
                    <li key={milestone.id} className="flex gap-3 py-4">
                      <span
                        className={cn(
                          "mt-1 size-2 rounded-full",
                          milestone.status === "APPROVED"
                            ? "bg-primary"
                            : milestone.status === "CHANGES_REQUESTED" || milestone.status === "OVERDUE"
                              ? "bg-destructive"
                              : "bg-accent"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <p className="text-xs font-medium">{milestone.title}</p>
                          <span className="text-[10px] text-muted-foreground">{label(milestone.status)}</span>
                        </div>
                        {milestone.description ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">{milestone.description}</p>
                        ) : null}
                        {milestone.dueAt ? (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CalendarDays className="size-3" />
                            {date(milestone.dueAt)}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-10 text-center text-xs text-muted-foreground">No milestones configured.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Research team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="flex items-center gap-3">
                <Avatar>
                  {project.owner.image ? <AvatarImage src={project.owner.image} alt="" /> : null}
                  <AvatarFallback>{project.owner.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">{project.owner.name}</p>
                  <p className="text-[10px] text-muted-foreground">Project owner</p>
                </div>
              </div>
              {project.supervisor ?
                <div className="flex items-center gap-3">
                  <Avatar>
                    {project.supervisor.image ? <AvatarImage src={project.supervisor.image} alt="" /> : null}
                    <AvatarFallback>{project.supervisor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{project.supervisor.name}</p>
                    <p className="text-[10px] text-muted-foreground">Supervisor</p>
                  </div>
                </div> : <p className="rounded-md border border-dashed p-3 text-[11px] text-muted-foreground">No supervisor assigned yet.</p>}
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar size="sm">
                    {member.user.image ? <AvatarImage src={member.user.image} alt="" /> : null}
                    <AvatarFallback>{member.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium">{member.user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{label(member.role)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Open tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {project.tasks.length ? (
                <ul className="divide-y">
                  {project.tasks.map((task) => (
                    <li key={task.id} className="py-3">
                      <div className="flex items-start gap-2">
                        <ListChecks className="mt-0.5 size-3.5 text-primary" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{task.title}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {label(task.status)} · {label(task.priority)}
                            {task.dueAt ? ` · ${date(task.dueAt)}` : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">No open tasks.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
