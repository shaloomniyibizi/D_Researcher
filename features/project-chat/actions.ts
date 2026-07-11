"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

import { createProjectChatMessage } from "./repositories/project-chat-repository"
import type { SendProjectChatMessageResult } from "./types"

const sendMessageSchema = z.object({
  projectId: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1, "Enter a message.").max(2_000, "Messages cannot exceed 2,000 characters."),
})

export async function sendProjectChatMessage(input: unknown): Promise<SendProjectChatMessageResult> {
  const session = await getServerSession(await headers())
  const role = session?.user.role
  if (!session || (role !== UserRole.STUDENT && role !== UserRole.SUPERVISOR)) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = sendMessageSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid message." }
  }

  try {
    const message = await createProjectChatMessage({
      userId: session.user.id,
      role,
      ...parsed.data,
    })
    if (!message) return { success: false, error: "You do not have access to this project chat." }

    revalidatePath(`/student/chat/${parsed.data.projectId}`)
    revalidatePath(`/supervisor/chat/${parsed.data.projectId}`)
    return { success: true, data: message }
  } catch (error) {
    console.error("Could not send project chat message.", error)
    return { success: false, error: "Could not send your message. Please try again." }
  }
}
