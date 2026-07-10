import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  FolderKanban,
  ListChecks,
  MessageSquareText,
  Plus,
  Sparkles,
} from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getStudentDashboardData } from "@/features/student-dashboard/repositories/student-dashboard-repository"
import type { ProjectStatus } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Student Dashboard | Researcher",
  description: "Track research projects, milestones, tasks, and supervision activity.",
}

const PROJECT_PROGRESS: Record<ProjectStatus, number> = {
  IDEA: 8,
  DRAFT_PROPOSAL: 18,
  PROPOSAL_SUBMITTED: 28,
  APPROVED: 35,
  IN_PROGRESS: 62,
  REVISION_REQUIRED: 70,
  COMPLETED: 92,
  DEFENDED: 100,
  ARCHIVED: 100,
}

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatMeetingDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function relativeDate(date: Date): string {
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return `Due in ${days}d`
}

export default async function StudentDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()
  const data = await getStudentDashboardData(session.user.id)

  if (!data) notFound()

  const primaryProject = data.projects[0]
  const nextMilestone = primaryProject?.milestones[0]
  const highPriorityTasks = data.tasks.filter((task) => task.priority === "HIGH" || task.priority === "URGENT").length
  const firstName = data.profile.name.split(" ")[0]

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-primary">
            {data.profile.department?.institution.name}
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what is happening across your research workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student/ai"><Sparkles /> Ask research AI</Link>
          </Button>
          <Button asChild>
            <Link href="/student/projects/new"><Plus /> New project</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Research summary">
        {[
          { label: "Active projects", value: data.projects.length, icon: FolderKanban, detail: primaryProject ? formatLabel(primaryProject.status) : "Start your first project" },
          { label: "Open tasks", value: data.tasks.length, icon: ListChecks, detail: `${highPriorityTasks} high priority` },
          { label: "Next milestone", value: nextMilestone ? formatDate(nextMilestone.dueAt ?? primaryProject.updatedAt) : "—", icon: CalendarClock, detail: nextMilestone?.title ?? "No milestone scheduled" },
          { label: "Unread updates", value: data.notifications.length, icon: MessageSquareText, detail: data.notifications[0]?.title ?? "You're all caught up" },
        ].map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardAction className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                <metric.icon className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-semibold">{metric.value}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Research projects</CardTitle>
              <CardDescription>Your current work and the next action that moves it forward.</CardDescription>
              <CardAction>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/projects">View all <ArrowRight /></Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="pt-1">
              {data.projects.length === 0 ? (
                <div className="grid min-h-56 place-items-center text-center">
                  <div>
                    <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-muted">
                      <FolderKanban className="size-5 text-muted-foreground" />
                    </span>
                    <h2 className="text-sm font-medium">No research project yet</h2>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                      Start with an idea and build it into a supervised final-year project.
                    </p>
                    <Button className="mt-4" size="sm" asChild>
                      <Link href="/student/projects/new"><Plus /> Create project</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {data.projects.map((project) => {
                    const milestone = project.milestones[0]
                    const progress = PROJECT_PROGRESS[project.status]

                    return (
                      <article key={project.id} className="py-5 first:pt-4 last:pb-1">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {formatLabel(project.status)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">Updated {formatDate(project.updatedAt)}</span>
                            </div>
                            <Link href={`/student/projects/${project.id}`} className="font-heading text-base font-semibold hover:text-primary">
                              {project.title}
                            </Link>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1.5"><FileText className="size-3.5" /> {project.counts.documents} documents</span>
                              <span className="flex items-center gap-1.5"><BookOpenText className="size-3.5" /> {project.counts.sources} sources</span>
                              <span className="flex items-center gap-1.5"><ListChecks className="size-3.5" /> {project.counts.tasks} tasks</span>
                            </div>
                          </div>
                          {project.supervisor ? (
                            <div className="flex shrink-0 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                              <Avatar size="sm">
                                {project.supervisor.image ? <AvatarImage src={project.supervisor.image} alt="" /> : null}
                                <AvatarFallback>{project.supervisor.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div><p className="text-[10px] text-muted-foreground">Supervisor</p><p className="text-[11px] font-medium">{project.supervisor.name}</p></div>
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-4">
                          <div className="mb-1.5 flex justify-between text-[10px]"><span className="text-muted-foreground">Overall progress</span><span className="font-medium">{progress}%</span></div>
                          <progress
                            className="h-1.5 w-full overflow-hidden rounded-full bg-muted accent-primary [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                            value={progress}
                            max={100}
                            aria-label={`${project.title} progress`}
                          />
                        </div>
                        {milestone ? (
                          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-dashed p-3">
                            <div className="flex min-w-0 items-center gap-2"><CircleDot className="size-4 shrink-0 text-accent" /><div className="min-w-0"><p className="truncate text-xs font-medium">{milestone.title}</p><p className="text-[10px] text-muted-foreground">Next milestone · {formatLabel(milestone.status)}</p></div></div>
                            {milestone.dueAt ? <span className={cn("shrink-0 text-[10px]", milestone.dueAt < new Date() ? "text-destructive" : "text-muted-foreground")}>{relativeDate(milestone.dueAt)}</span> : null}
                          </div>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>My tasks</CardTitle>
              <CardDescription>Prioritized work assigned across your projects.</CardDescription>
              <CardAction><Button variant="ghost" size="sm" asChild><Link href="/student/tasks">View board <ArrowRight /></Link></Button></CardAction>
            </CardHeader>
            <CardContent className="pt-2">
              {data.tasks.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 size-6 text-primary" />No open tasks. You&apos;re all caught up.</div>
              ) : (
                <ul className="divide-y">
                  {data.tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 py-3">
                      <span className={cn("size-2 rounded-full", task.priority === "URGENT" || task.priority === "HIGH" ? "bg-destructive" : task.priority === "MEDIUM" ? "bg-accent" : "bg-muted-foreground")} />
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{task.title}</p><p className="truncate text-[10px] text-muted-foreground">{task.project.title}</p></div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{formatLabel(task.status)}</span>
                      <span className={cn("hidden w-24 text-right text-[10px] sm:block", task.dueAt && task.dueAt < new Date() ? "text-destructive" : "text-muted-foreground")}>{task.dueAt ? relativeDate(task.dueAt) : "No due date"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Upcoming meetings</CardTitle>
              <CardDescription>Your next supervision sessions.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {data.meetings.length === 0 ? (
                <div className="py-8 text-center"><CalendarClock className="mx-auto mb-2 size-6 text-muted-foreground" /><p className="text-xs font-medium">No meetings scheduled</p><p className="mt-1 text-[11px] text-muted-foreground">Your next supervision meeting will appear here.</p></div>
              ) : (
                <ol className="space-y-4">
                  {data.meetings.map((meeting) => (
                    <li key={meeting.id} className="flex gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Clock3 className="size-4" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{meeting.title}</p><p className="truncate text-[10px] text-muted-foreground">{meeting.project.title}</p><p className="mt-1 text-[10px] font-medium text-primary">{formatMeetingDate(meeting.startsAt)}</p></div>
                      {meeting.meetingUrl ? <Button variant="outline" size="sm" asChild><a href={meeting.meetingUrl}>Join</a></Button> : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recent updates</CardTitle>
              <CardDescription>Feedback, approvals, and reminders.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {data.notifications.length === 0 ? (
                <div className="py-8 text-center"><CheckCircle2 className="mx-auto mb-2 size-6 text-primary" /><p className="text-xs">You&apos;re all caught up.</p></div>
              ) : (
                <ul className="divide-y">
                  {data.notifications.map((notification) => (
                    <li key={notification.id} className="py-3">
                      <div className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="text-xs font-medium">{notification.title}</p><p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{notification.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatDate(notification.createdAt)}</p></div></div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
