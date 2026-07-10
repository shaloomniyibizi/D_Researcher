"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { UserRole } from "@/generated/prisma/client"
import { generateResearchResponse, isGeminiConfigured } from "@/lib/gemini"
import { auth } from "@/lib/auth"

import { prepareAiTurn, saveAssistantMessage } from "./repositories/ai-workspace-repository"
import type { SendAiMessageResult } from "./types"

const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1).max(100).nullable(),
  projectId: z.string().trim().min(1).max(100).nullable(),
  prompt: z.string().trim().min(2, "Enter a question for the research assistant.").max(4_000),
})

export async function sendAiMessage(input: unknown): Promise<SendAiMessageResult> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== UserRole.STUDENT) {
    return { success: false, error: "Unauthorized" }
  }

  if (!isGeminiConfigured) {
    return { success: false, error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }
  }

  const parsed = sendMessageSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid message." }
  }

  try {
    const turn = await prepareAiTurn({ userId: session.user.id, ...parsed.data })

    if (!turn) return { success: false, error: "Conversation or project access was denied." }
    if (turn.rateLimited) return { success: false, error: "Too many messages. Wait a minute and try again." }

    const response = await generateResearchResponse({
      messages: turn.history,
      projectContext: turn.projectContext,
    })

    if (!response) return { success: false, error: "The assistant returned an empty response." }

    const message = await saveAssistantMessage(turn.conversationId, response)
    revalidatePath("/student/ai")

    return {
      success: true,
      data: {
        conversationId: turn.conversationId,
        message: { ...message, role: "assistant" },
      },
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "The research assistant is unavailable right now. Please try again." }
  }
}
