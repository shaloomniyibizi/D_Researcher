import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { ProjectChatList } from "@/features/project-chat/components/project-chat-list"
import { getProjectChatRooms } from "@/features/project-chat/repositories/project-chat-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

export default async function StudentChatPage() {
  const session = await getServerSession(await headers())
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.STUDENT) redirect("/onboarding")

  let rooms
  try {
    rooms = await getProjectChatRooms(session.user.id, UserRole.STUDENT)
  } catch (error) {
    console.error("Could not load student chatrooms.", error)
    return <DatabaseUnavailable />
  }
  return <ProjectChatList rooms={rooms} basePath="/student/chat" />
}
