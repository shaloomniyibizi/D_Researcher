import { ChevronRight, FilePenLine } from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CreateProjectForm } from "@/features/projects/components/create-project-form"
import { getAvailableSupervisors, getStudentProjectForEdit } from "@/features/projects/repositories/project-repository"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Edit Project | Researcher",
  description: "Update research project details, supervision, and visibility.",
}

export default async function EditStudentProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  const { projectId } = await params
  const [project, supervisors] = await Promise.all([
    getStudentProjectForEdit(session.user.id, projectId),
    getAvailableSupervisors(session.user.id),
  ])

  if (!project || !supervisors) notFound()

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/student/projects" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="size-3" />
        <Link href={`/student/projects/${project.id}`} className="max-w-56 truncate hover:text-foreground">{project.title}</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Edit</span>
      </nav>

      <header className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FilePenLine className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Edit research project</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Refine the project foundation, preferred supervisor, and visibility.
          </p>
        </div>
      </header>

      <CreateProjectForm supervisors={supervisors} project={project} />
    </main>
  )
}
