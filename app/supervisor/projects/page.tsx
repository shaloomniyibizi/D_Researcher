import { ArrowRight, FolderKanban } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupervisorDashboardData } from "@/features/supervisor-dashboard/repositories/supervisor-dashboard-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

function label(value: string): string {
  return value.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

export default async function SupervisedProjectsPage() {
  const session = await getServerSession(await headers())
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.SUPERVISOR) notFound()

  const data = await getSupervisorDashboardData(session.user.id)
  if (!data) notFound()

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Supervised projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review student research, inspect tracked changes, and provide feedback.</p>
      </div>
      <Card>
        <CardHeader className="border-b"><CardTitle>Assigned research</CardTitle><CardDescription>{data.projects.length} active project{data.projects.length === 1 ? "" : "s"}</CardDescription></CardHeader>
        <CardContent className="divide-y p-0">
          {data.projects.length === 0 ? (
            <div className="grid min-h-72 place-items-center text-center"><div><FolderKanban className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No assigned projects</p><p className="mt-1 text-xs text-muted-foreground">Projects assigned to you will appear here.</p></div></div>
          ) : data.projects.map((project) => (
            <article key={project.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <Avatar>{project.owner.image ? <AvatarImage src={project.owner.image} alt={project.owner.name} /> : null}<AvatarFallback>{project.owner.name.charAt(0)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-semibold">{project.title}</h2><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{label(project.status)}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{project.owner.name}{project.owner.studentNumber ? ` · ${project.owner.studentNumber}` : ""}</p><p className="mt-2 text-[10px] text-muted-foreground">{project.counts.documents} documents · {project.counts.submissions} submissions · {project.counts.tasks} tasks</p></div>
              <div className="flex gap-2"><Button variant="outline" size="sm" asChild><Link href={`/supervisor/chat/${project.id}`}>Chat</Link></Button><Button size="sm" asChild><Link href={`/supervisor/projects/${project.id}`}>Review <ArrowRight /></Link></Button></div>
            </article>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
