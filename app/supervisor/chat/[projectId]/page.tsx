import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { ProjectChatRoom } from "@/features/project-chat/components/project-chat-room"
import { getProjectChatData } from "@/features/project-chat/repositories/project-chat-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

export default async function SupervisorChatRoomPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(await headers())
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.SUPERVISOR) redirect("/onboarding")
  const { projectId } = await params
  const data = await getProjectChatData(session.user.id, UserRole.SUPERVISOR, projectId)
  if (!data) notFound()
  return <ProjectChatRoom data={data} currentUserId={session.user.id} basePath="/supervisor/chat" />
}
