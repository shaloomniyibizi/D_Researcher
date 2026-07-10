import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { AiWorkspace } from "@/features/ai-workspace/components/ai-workspace"
import { getAiWorkspaceData } from "@/features/ai-workspace/repositories/ai-workspace-repository"
import { auth } from "@/lib/auth"
import { isGeminiConfigured } from "@/lib/gemini"

export const metadata: Metadata = {
  title: "AI Workspace | Researcher",
  description: "Project-aware academic research assistance for university students.",
}

export default async function StudentAiWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; new?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  const query = await searchParams
  const data = await getAiWorkspaceData(session.user.id, query.conversation, query.new === "1")
  if (!data) redirect("/onboarding")

  return <AiWorkspace data={data} configured={isGeminiConfigured} />
}
