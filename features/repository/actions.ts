"use server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { UserRole } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { publishPastProject } from "./repositories/repository-repository"
import type { PublishPastProjectResult } from "./types"
import type { RepositoryChatResult } from "./types"
import { prepareRepositoryChatTurn, saveRepositoryChatAnswer } from "./repositories/repository-chat-repository"
import { generateRepositoryProjectResponse, isGeminiConfigured } from "@/lib/gemini"

const schema = z.object({ projectId: z.string().cuid(), year: z.number().int().min(1900).max(new Date().getFullYear()), technologies: z.array(z.string().trim().min(1).max(60)).max(12), externalUrl: z.union([z.url().max(500), z.literal("")]).optional() })
export async function addPastProject(input: unknown): Promise<PublishPastProjectResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid project details." }
  try {
    const record = await publishPastProject({ userId: session.user.id, projectId: parsed.data.projectId, year: parsed.data.year, technologies: [...new Set(parsed.data.technologies.map((value) => value.toLowerCase()))], externalUrl: parsed.data.externalUrl || null })
    if (!record) return { success: false, error: "Project not found or it is already in the repository." }
    revalidatePath("/student/repository")
    return { success: true, data: { recordId: record.id } }
  } catch (error) { console.error(error); return { success: false, error: "Could not add this project to the repository." } }
}

const chatSchema = z.object({ conversationId: z.string().cuid().nullable(), prompt: z.string().trim().min(2).max(4_000) })
export async function chatWithPastProject(input: unknown): Promise<RepositoryChatResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }
  if (!isGeminiConfigured) return { success: false, error: "Gemini is not configured." }
  const parsed = chatSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Enter a valid question." }
  try {
    const turn = await prepareRepositoryChatTurn({ userId: session.user.id, ...parsed.data })
    if (!turn) return { success: false, error: "Past project not found." }
    if (turn.rateLimited) return { success: false, error: "Too many questions. Wait a minute and try again." }
    const answer = await generateRepositoryProjectResponse({ messages: turn.history, projectContext: turn.context })
    const message = await saveRepositoryChatAnswer(turn.conversationId, answer, turn.sources)
    return { success: true, data: { conversationId: turn.conversationId, message: { ...message, role: "assistant", sources: turn.sources } } }
  } catch (error) {
    console.error(error)
    return { success: false, error: "The project assistant is unavailable right now." }
  }
}
