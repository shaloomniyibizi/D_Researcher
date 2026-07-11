import { ChevronRight, FolderKanban } from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CreateProjectForm } from "@/features/projects/components/create-project-form"
import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { getAvailableSupervisors } from "@/features/projects/repositories/project-repository"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Create Project | Researcher",
  description: "Start and structure a new university research project.",
}

export default async function NewStudentProjectPage() {
  let session

  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch (error) {
    console.error("Could not connect to the database while loading the new-project page.", error)
    return <DatabaseUnavailable />
  }

  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  let supervisors

  try {
    supervisors = await getAvailableSupervisors(session.user.id)
  } catch (error) {
    console.error("Could not connect to the database while loading supervisors.", error)
    return <DatabaseUnavailable />
  }
  if (!supervisors) redirect("/onboarding")

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/student" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">New project</span>
      </nav>

      <header className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FolderKanban className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Create a research project</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Capture the foundation of your research idea. Only the title is required to get started.
          </p>
        </div>
      </header>

      <CreateProjectForm supervisors={supervisors} />
    </main>
  )
}
