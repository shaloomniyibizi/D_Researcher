"use server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { UserRole } from "@/generated/prisma/client"
import { GeminiTemporarilyUnavailableError, generateResearchIdeas, isGeminiConfigured } from "@/lib/gemini"
import { getServerSession } from "@/lib/server-session"
import { completeIdeaGeneration, discardIdeaGeneration, failIdeaGeneration, prepareIdeaGeneration, saveIdeaGeneration } from "./repositories/idea-generation-repository"
import type { GenerateIdeasResult, IdeaDecisionResult } from "./types"


const schema = z.object({
  discipline: z.string().trim().min(2).max(120),
  interests: z.string().trim().min(3).max(500),
  problemArea: z.string().trim().max(500),
  technologies: z.string().trim().max(300),
  constraints: z.string().trim().max(500)
})

export async function generateProjectIdeas(input: unknown): Promise<GenerateIdeasResult> {
  const session = await getServerSession(await headers());

  if (!session || session.user.role !== UserRole.STUDENT)
    return { success: false, error: "Unauthorized" };

  if (!isGeminiConfigured)
    return { success: false, error: "Gemini is not configured." };

  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid idea criteria." };

  let jobId: string | null = null;

  try {
    const prepared = await prepareIdeaGeneration(session.user.id, parsed.data);
    if (!prepared)
      return { success: false, error: "Complete onboarding first." };

    if (prepared.rateLimited)
      return { success: false, error: "Too many requests. Wait a minute and try again." }; jobId = prepared.job.id;

    const ideas = await generateResearchIdeas(parsed.data);
    const job = await completeIdeaGeneration(jobId, ideas);
    revalidatePath("/student/ideas");

    return { success: true, data: { id: job.id, createdAt: job.createdAt, ideas } }
  } catch (error) {
    if (jobId) await failIdeaGeneration(jobId).catch(console.error);
    if (error instanceof GeminiTemporarilyUnavailableError) {
      return { success: false, error: "The AI service is busy right now. Please try again in a few minutes." }
    }
    console.error("Idea generation failed", error);
    return { success: false, error: "Could not generate ideas right now. Please try again." }
  }
}

const decisionSchema = z.object({ jobId: z.string().cuid(), ideaIndex: z.number().int().min(0).max(4) })

export async function saveGeneratedIdea(input: unknown): Promise<IdeaDecisionResult> {
  const session = await getServerSession(await headers())
  if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }
  const parsed = decisionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid generated idea." }
  try {
    const saved = await saveIdeaGeneration(session.user.id, parsed.data.jobId, parsed.data.ideaIndex)
    if (!saved) return { success: false, error: "Generated idea was not found." }
    revalidatePath("/student/ideas")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Could not save this idea right now." }
  }
}

export async function discardGeneratedIdeas(input: unknown): Promise<IdeaDecisionResult> {
  const session = await getServerSession(await headers())
  if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }
  const parsed = z.object({ jobId: z.string().cuid() }).safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid generation." }
  try {
    const discarded = await discardIdeaGeneration(session.user.id, parsed.data.jobId)
    if (!discarded) return { success: false, error: "Generation was not found." }
    revalidatePath("/student/ideas")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Could not discard these ideas right now." }
  }
}
