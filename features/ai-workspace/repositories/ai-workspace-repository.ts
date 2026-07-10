import prisma from "@/lib/prisma"

import type { AiWorkspaceData } from "../types"

async function getStudentContext(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", status: "ACTIVE", departmentId: { not: null } },
    select: { departmentId: true },
  })
}

export async function getAiWorkspaceData(
  userId: string,
  requestedConversationId?: string,
  forceNew = false,
): Promise<AiWorkspaceData | null> {
  const student = await getStudentContext(userId)
  if (!student?.departmentId) return null

  const [projects, conversations] = await Promise.all([
    prisma.project.findMany({
      where: {
        departmentId: student.departmentId,
        deletedAt: null,
        OR: [{ ownerId: userId }, { members: { some: { userId, joinedAt: { not: null } } } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    }),
    prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        project: { select: { id: true, title: true } },
      },
    }),
  ])

  const activeConversation = forceNew
    ? null
    : conversations.find((item) => item.id === requestedConversationId)
      ?? conversations[0]
      ?? null
  const rawMessages = activeConversation
    ? await prisma.aiMessage.findMany({
        where: { conversationId: activeConversation.id, conversation: { userId } },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, role: true, content: true, createdAt: true },
      })
    : []

  return {
    projects,
    conversations,
    activeConversation,
    messages: rawMessages.flatMap((message) =>
      message.role === "user" || message.role === "assistant"
        ? [{ ...message, role: message.role }]
        : [],
    ),
  }
}

export async function prepareAiTurn(input: {
  userId: string
  conversationId: string | null
  projectId: string | null
  prompt: string
}) {
  return prisma.$transaction(async (db) => {
    const student = await db.user.findFirst({
      where: { id: input.userId, role: "STUDENT", status: "ACTIVE", departmentId: { not: null } },
      select: { departmentId: true },
    })
    if (!student?.departmentId) return null

    const recentMessageCount = await db.aiMessage.count({
      where: {
        authorId: input.userId,
        role: "user",
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    })
    if (recentMessageCount >= 8) return { rateLimited: true as const }

    let conversation = input.conversationId
      ? await db.aiConversation.findFirst({
          where: { id: input.conversationId, userId: input.userId },
          select: { id: true, projectId: true },
        })
      : null

    if (input.conversationId && !conversation) return null

    if (!conversation) {
      let projectId: string | null = null
      if (input.projectId) {
        const project = await db.project.findFirst({
          where: {
            id: input.projectId,
            departmentId: student.departmentId,
            deletedAt: null,
            OR: [{ ownerId: input.userId }, { members: { some: { userId: input.userId, joinedAt: { not: null } } } }],
          },
          select: { id: true },
        })
        if (!project) return null
        projectId = project.id
      }

      conversation = await db.aiConversation.create({
        data: {
          userId: input.userId,
          projectId,
          title: input.prompt.slice(0, 72),
        },
        select: { id: true, projectId: true },
      })
    }

    await db.aiMessage.create({
      data: {
        conversationId: conversation.id,
        authorId: input.userId,
        role: "user",
        content: input.prompt,
      },
      select: { id: true },
    })

    const [history, project] = await Promise.all([
      db.aiMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { role: true, content: true },
      }),
      conversation.projectId
        ? db.project.findFirst({
            where: { id: conversation.projectId, departmentId: student.departmentId },
            select: { title: true, abstract: true, problemStatement: true, objectives: true, keywords: true, status: true },
          })
        : null,
    ])

    await db.aiConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } })

    return {
      rateLimited: false as const,
      conversationId: conversation.id,
      history: history.reverse().flatMap((message): Array<{ role: "user" | "assistant"; content: string }> => {
        if (message.role !== "user" && message.role !== "assistant") return []
        return [{ role: message.role, content: message.content }]
      }),
      projectContext: project
        ? [
            `Title: ${project.title}`,
            `Status: ${project.status}`,
            project.abstract ? `Abstract: ${project.abstract.replace(/<[^>]*>/g, " ")}` : null,
            project.problemStatement ? `Problem: ${project.problemStatement.replace(/<[^>]*>/g, " ")}` : null,
            project.objectives.length ? `Objectives: ${project.objectives.join("; ")}` : null,
            project.keywords.length ? `Keywords: ${project.keywords.join(", ")}` : null,
          ].filter(Boolean).join("\n")
        : null,
    }
  })
}

export async function saveAssistantMessage(conversationId: string, content: string) {
  return prisma.aiMessage.create({
    data: { conversationId, role: "assistant", content },
    select: { id: true, role: true, content: true, createdAt: true },
  })
}
