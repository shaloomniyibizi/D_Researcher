import { BookOpenText, CalendarClock, FileText, FolderKanban, ListChecks, Plus, Users } from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStudentProjects } from "@/features/projects/repositories/project-repository"
import type { ProjectStatus } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "My Research Projects | Researcher",
  description: "Manage owned and collaborative university research projects.",
}

const PROGRESS: Record<ProjectStatus, number> = {
  IDEA: 8, DRAFT_PROPOSAL: 18, PROPOSAL_SUBMITTED: 28, APPROVED: 35,
  IN_PROGRESS: 62, REVISION_REQUIRED: 70, COMPLETED: 92, DEFENDED: 100, ARCHIVED: 100,
}

function label(value: string): string {
  return value.toLowerCase().split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
}

function plainText(value: string | null) {
  return <div dangerouslySetInnerHTML={{ __html: value || "No project abstract has been added yet." }}></div>
}

function date(value: Date): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value)
}

export default async function StudentProjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  const projects = await getStudentProjects(session.user.id)
  if (!projects) redirect("/onboarding")

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-1 text-xs font-medium text-primary">Research workspace</p><h1 className="font-heading text-2xl font-semibold sm:text-3xl">My projects</h1><p className="mt-1 text-sm text-muted-foreground">Manage your owned projects and research collaborations.</p></div>
        <Button asChild><Link href="/student/projects/new"><Plus /> New project</Link></Button>
      </header>

      {projects.length === 0 ? (
        <Card><CardContent className="grid min-h-80 place-items-center text-center"><div><span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted"><FolderKanban className="size-5 text-muted-foreground" /></span><h2 className="text-sm font-medium">Create your first research project</h2><p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Capture your idea, select a supervisor, and begin the research lifecycle.</p><Button className="mt-4" asChild><Link href="/student/projects/new"><Plus /> Create project</Link></Button></div></CardContent></Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="h-full transition-shadow hover:shadow-sm">
              <CardHeader className="border-b">
                <div className="mb-2 flex items-center justify-between gap-3"><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">{label(project.status)}</span><span className="text-[10px] text-muted-foreground">Updated {date(project.updatedAt)}</span></div>
                <CardTitle className="line-clamp-2 text-base"><Link href={`/student/projects/${project.id}`} className="hover:text-primary">{project.title}</Link></CardTitle>
                <CardDescription className="line-clamp-3 min-h-[3.75rem]">{plainText(project.abstract)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-1">
                <div><div className="mb-1.5 flex justify-between text-[10px]"><span className="text-muted-foreground">Research progress</span><span>{PROGRESS[project.status]}%</span></div><progress value={PROGRESS[project.status]} max={100} className="h-1.5 w-full overflow-hidden rounded-full bg-muted accent-primary [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary" /></div>
                <div className="grid grid-cols-4 gap-2 text-center">{[{ icon: FileText, count: project.counts.documents, label: "Docs" }, { icon: BookOpenText, count: project.counts.sources, label: "Sources" }, { icon: ListChecks, count: project.counts.tasks, label: "Tasks" }, { icon: Users, count: project.counts.members + 1, label: "People" }].map((metric) => <div key={metric.label} className="rounded-md bg-muted/60 p-2"><metric.icon className="mx-auto size-3.5 text-muted-foreground" /><p className="mt-1 text-xs font-medium">{metric.count}</p><p className="text-[9px] text-muted-foreground">{metric.label}</p></div>)}</div>
                {project.nextMilestone ? <div className="rounded-md border border-dashed p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><CalendarClock className="size-3.5" /> Next milestone</p><p className="mt-1 truncate text-xs font-medium">{project.nextMilestone.title}</p></div> : null}
                <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">{project.supervisor ? <div className="flex min-w-0 items-center gap-2"><Avatar size="sm">{project.supervisor.image ? <AvatarImage src={project.supervisor.image} alt="" /> : null}<AvatarFallback>{project.supervisor.name[0]}</AvatarFallback></Avatar><div className="min-w-0"><p className="text-[9px] text-muted-foreground">Supervisor</p><p className="truncate text-[10px] font-medium">{project.supervisor.name}</p></div></div> : <span className="text-[10px] text-muted-foreground">No supervisor assigned</span>}<Button variant="outline" size="sm" asChild><Link href={`/student/projects/${project.id}`}>Open</Link></Button></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
