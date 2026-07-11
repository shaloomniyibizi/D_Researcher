import prisma from "@/lib/prisma"

import type { DocumentChatCitation, DocumentChatData, DocumentChatMessage } from "../types"

function toCitations(value: unknown): DocumentChatCitation[] | null {
  if (!Array.isArray(value)) return null

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "chunkId" in item &&
      "chunkIndex" in item &&
      "snippet" in item
    ) {
      const candidate = item as Record<string, unknown>
      if (
        typeof candidate.chunkId === "string" &&
        typeof candidate.chunkIndex === "number" &&
        typeof candidate.snippet === "string"
      ) {
        return [{ chunkId: candidate.chunkId, chunkIndex: candidate.chunkIndex, snippet: candidate.snippet }]
      }
    }
    return []
  })
}

function toMessage(message: {
  id: string
  role: string
  content: string
  citations: unknown
  createdAt: Date
}): DocumentChatMessage | null {
  if (message.role !== "user" && message.role !== "assistant") return null

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    citations: toCitations(message.citations),
    createdAt: message.createdAt,
  }
}

export async function getDocumentChatData(
  userId: string,
  documentId: string,
): Promise<Omit<DocumentChatData, "documents"> | null> {
  const document = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, uploadedFile: { uploadedById: userId } },
    select: {
      id: true,
      title: true,
      status: true,
      errorMessage: true,
      tokenCount: true,
      createdAt: true,
      indexedAt: true,
      uploadedFile: { select: { name: true, url: true, sizeBytes: true } },
    },
  })

  if (!document) return null

  const conversation = await prisma.aiConversation.findFirst({
    where: { userId, knowledgeDocumentId: documentId },
    select: { id: true },
  })

  const messages = conversation
    ? await prisma.aiMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, role: true, content: true, citations: true, createdAt: true },
      })
    : []

  return {
    document,
    conversationId: conversation?.id ?? null,
    messages: messages.flatMap((message) => {
      const mapped = toMessage(message)
      return mapped ? [mapped] : []
    }),
  }
}

export async function prepareDocumentChatTurn(input: {
  userId: string
  documentId: string
  prompt: string
}): Promise<
  | null
  | { rateLimited: true }
  | { rateLimited: false; conversationId: string; history: Array<{ role: "user" | "assistant"; content: string }> }
> {
  return prisma.$transaction(async (db) => {
    const document = await db.knowledgeDocument.findFirst({
      where: { id: input.documentId, uploadedFile: { uploadedById: input.userId }, status: "INDEXED" },
      select: { id: true },
    })
    if (!document) return null

    const recentMessageCount = await db.aiMessage.count({
      where: {
        authorId: input.userId,
        role: "user",
        createdAt: { gte: new Date(Date.now() - 60_000) },
        conversation: { knowledgeDocumentId: { not: null } },
      },
    })
    if (recentMessageCount >= 8) return { rateLimited: true as const }

    let conversation = await db.aiConversation.findFirst({
      where: { userId: input.userId, knowledgeDocumentId: input.documentId },
      select: { id: true },
    })

    if (!conversation) {
      conversation = await db.aiConversation.create({
        data: {
          userId: input.userId,
          knowledgeDocumentId: input.documentId,
          title: input.prompt.slice(0, 72),
        },
        select: { id: true },
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

    const recentMessages = await db.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { role: true, content: true },
    })

    return {
      rateLimited: false as const,
      conversationId: conversation.id,
      history: recentMessages.reverse().flatMap((message): Array<{ role: "user" | "assistant"; content: string }> => {
        if (message.role !== "user" && message.role !== "assistant") return []
        return [{ role: message.role, content: message.content }]
      }),
    }
  })
}

export async function getChunksByVectorIds(
  documentId: string,
  vectorIds: string[],
): Promise<Array<{ id: string; chunkIndex: number; content: string; vectorId: string | null }>> {
  if (vectorIds.length === 0) return []

  return prisma.knowledgeChunk.findMany({
    where: { knowledgeDocumentId: documentId, vectorId: { in: vectorIds } },
    select: { id: true, chunkIndex: true, content: true, vectorId: true },
  })
}

export async function saveDocumentAssistantMessage(
  conversationId: string,
  content: string,
  citations: DocumentChatCitation[],
): Promise<DocumentChatMessage> {
  const message = await prisma.aiMessage.create({
    data: { conversationId, role: "assistant", content, citations },
    select: { id: true, role: true, content: true, citations: true, createdAt: true },
  })

  return {
    id: message.id,
    role: "assistant",
    content: message.content,
    citations: toCitations(message.citations),
    createdAt: message.createdAt,
  }
}
