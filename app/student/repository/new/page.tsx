import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { AddPastProjectForm } from "@/features/repository/components/add-past-project-form"
import { getPublishableProjects } from "@/features/repository/repositories/repository-repository"
import { auth } from "@/lib/auth"

export const metadata: Metadata = { title: "Add Past Project | Researcher" }
export default async function AddPastProjectPage() { const session = await auth.api.getSession({ headers: await headers() }); if (!session) redirect("/auth?mode=sign-in"); if (session.user.role !== "STUDENT") notFound(); const projects = await getPublishableProjects(session.user.id); if (!projects) redirect("/onboarding"); return <AddPastProjectForm projects={projects} /> }
