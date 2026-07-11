import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { IdeaGenerator } from "@/features/idea-generation/components/idea-generator"
import { getIdeaGenerationPage } from "@/features/idea-generation/repositories/idea-generation-repository"
import { UserRole } from "@/generated/prisma/client"
import { isGeminiConfigured } from "@/lib/gemini"
import { getServerSession } from "@/lib/server-session"
export default async function StudentIdeasPage() { const session = await getServerSession(await headers()); if (!session) redirect("/auth?mode=sign-in"); if (session.user.role !== UserRole.STUDENT) notFound(); const data = await getIdeaGenerationPage(session.user.id); if (!data) redirect("/onboarding"); return <IdeaGenerator context={data.context} history={data.history} configured={isGeminiConfigured} /> }
