import type { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { researchIdeasSchema } from "@/lib/gemini"
import type { IdeaGeneration, ResearchIdea } from "../types"

function parseIdeas(output: unknown): ResearchIdea[] {
  if (!output || typeof output !== "object" || !("saved" in output) || output.saved !== true) return []
  const parsed = researchIdeasSchema.safeParse(output);
  return parsed.success ? parsed.data.ideas : []
}
export async function getIdeaGenerationPage(userId: string): Promise<{
  context: { discipline: string; interests: string }; history: IdeaGeneration[]
} | null> {
  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "STUDENT",
      status: "ACTIVE",
      departmentId: {
        not: null

      }
    },
    select: {
      researchInterests: true,
      department: {
        select: { name: true }
      },
      aiJobs: {
        where: {
          type: "IDEA_GENERATION",
          status: "SUCCEEDED"
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 10,
        select: {
          id: true,
          output: true,
          createdAt: true
        }
      }
    }
  }
  )
  if (!student?.department) return null

  return {
    context: {
      discipline: student.department.name,
      interests: student.researchInterests.join(", ")
    },
    history: student.aiJobs.map((job) => ({
      id: job.id,
      createdAt: job.createdAt,
      ideas: parseIdeas(job.output)
    }
    )).filter((item) => item.ideas.length > 0)
  }
}

export async function prepareIdeaGeneration(userId: string, input: Prisma.InputJsonValue) {
  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "STUDENT",
      status: "ACTIVE",
      departmentId: {
        not: null
      }
    },
    select: {
      id: true
    }
  })
  if (!student) return null

  const recent = await prisma.aiJob.count({
    where: {
      requestedById: userId,
      type: "IDEA_GENERATION",
      status: {
        in: ["RUNNING", "SUCCEEDED"]
      },
      createdAt: {
        gte: new Date(Date.now() - 60_000)
      }
    }
  })

  if (recent >= 3) return { rateLimited: true as const }

  const job = await prisma.aiJob.create({
    data: {
      requestedById: userId,
      type: "IDEA_GENERATION",
      status: "RUNNING",
      input,
      startedAt: new Date()
    },
    select: {
      id: true,
      createdAt: true
    }
  })
  return { rateLimited: false as const, job }
}

export async function completeIdeaGeneration(jobId: string, ideas: ResearchIdea[]) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: "SUCCEEDED",
      output: { ideas, saved: false },
      completedAt: new Date()
    },
    select: { id: true, createdAt: true }
  })
}

export async function saveIdeaGeneration(userId: string, jobId: string, ideaIndex: number) {
  const job = await prisma.aiJob.findFirst({
    where: { id: jobId, requestedById: userId, type: "IDEA_GENERATION", status: "SUCCEEDED" },
    select: { output: true }
  })
  if (!job) return null
  const parsed = researchIdeasSchema.safeParse(job.output)
  const idea = parsed.success ? parsed.data.ideas[ideaIndex] : undefined
  if (!idea) return null
  return prisma.aiJob.update({ where: { id: jobId }, data: { output: { ideas: [idea], saved: true } }, select: { id: true } })
}

export async function discardIdeaGeneration(userId: string, jobId: string) {
  const result = await prisma.aiJob.deleteMany({
    where: { id: jobId, requestedById: userId, type: "IDEA_GENERATION" }
  })
  return result.count > 0
}

export async function failIdeaGeneration(jobId: string) {
  await prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      error: "Generation failed",
      completedAt: new Date()
    }
  })
}
