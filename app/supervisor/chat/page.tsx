import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { ProjectChatList } from "@/features/project-chat/components/project-chat-list"
import { getProjectChatRooms } from "@/features/project-chat/repositories/project-chat-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

export default async function SupervisorChatPage() {
  const session = await getServerSession(await headers())
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.SUPERVISOR) redirect("/onboarding")
  let rooms
  try {
    rooms = await getProjectChatRooms(session.user.id, UserRole.SUPERVISOR)
  } catch (error) {
    console.error("Could not load supervisor chatrooms.", error)
    return <DatabaseUnavailable />
  }
  return <main className="mx-auto max-w-7xl p-4 md:p-6"><ProjectChatList rooms={rooms} basePath="/supervisor/chat" /></main>
}
