"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { UTApi } from "uploadthing/server"
import { z } from "zod"

import { UserRole } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { embedText, isEmbeddingConfigured } from "@/lib/embeddings"
import { generateDocumentChatResponse, isGeminiConfigured } from "@/lib/gemini"
import { deleteKnowledgeVectorsForDocument, isPineconeConfigured, queryKnowledgeVectors } from "@/lib/pinecone"

import {
  getChunksByVectorIds,
  prepareDocumentChatTurn,
  saveDocumentAssistantMessage,
} from "./repositories/document-chat-repository"
import { deleteStudentDocument } from "./repositories/knowledge-document-repository"
import type { DeleteDocumentResult, DocumentChatCitation, SendDocumentMessageResult } from "./types"

const utapi = new UTApi()

const deleteDocumentSchema = z.object({
  documentId: z.string().trim().min(1).max(100),
})

export async function deleteKnowledgeDocument(input: unknown): Promise<DeleteDocumentResult> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== UserRole.STUDENT) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = deleteDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request." }
  }

  try {
    const result = await deleteStudentDocument(session.user.id, parsed.data.documentId)
    if (!result.success) {
      return { success: false, error: "Document not found." }
    }

    await deleteKnowledgeVectorsForDocument(parsed.data.documentId)
    if (result.uploadedFileKey) {
      await utapi.deleteFiles([result.uploadedFileKey])
    }

    revalidatePath("/student/documents")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Could not delete this document. Please try again." }
  }
}

const sendMessageSchema = z.object({
  documentId: z.string().trim().min(1).max(100),
  prompt: z.string().trim().min(2, "Enter a question about this document.").max(4_000),
})

export async function sendDocumentChatMessage(input: unknown): Promise<SendDocumentMessageResult> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== UserRole.STUDENT) {
    return { success: false, error: "Unauthorized" }
  }

  if (!isGeminiConfigured) {
    return { success: false, error: "Gemini is not configured. Add GEMINI_API_KEY to the server environment." }
  }
  if (!isEmbeddingConfigured) {
    return { success: false, error: "Embeddings are not configured. Add GEMINI_API_KEY to the server environment." }
  }
  if (!isPineconeConfigured) {
    return { success: false, error: "Pinecone is not configured. Add PINECONE_API_KEY to the server environment." }
  }

  const parsed = sendMessageSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid message." }
  }

  try {
    const turn = await prepareDocumentChatTurn({ userId: session.user.id, ...parsed.data })

    if (!turn) return { success: false, error: "This document isn't ready to chat with yet." }
    if (turn.rateLimited) return { success: false, error: "Too many messages. Wait a minute and try again." }

    const questionVector = await embedText(parsed.data.prompt)
    const matches = await queryKnowledgeVectors({
      vector: questionVector,
      userId: session.user.id,
      documentId: parsed.data.documentId,
      topK: 5,
    })

    const vectorIds = matches.map((match) => match.id)
    const chunks = await getChunksByVectorIds(parsed.data.documentId, vectorIds)
    const chunksByVectorId = new Map(chunks.map((chunk) => [chunk.vectorId, chunk]))

    const orderedChunks = vectorIds.flatMap((vectorId) => {
      const chunk = chunksByVectorId.get(vectorId)
      return chunk ? [chunk] : []
    })

    const contextChunks = orderedChunks.map((chunk, index) => ({ index: index + 1, content: chunk.content }))

    const response = await generateDocumentChatResponse({ messages: turn.history, contextChunks })
    if (!response) return { success: false, error: "The assistant returned an empty response." }

    const citations: DocumentChatCitation[] = orderedChunks.map((chunk) => ({
      chunkId: chunk.id,
      chunkIndex: chunk.chunkIndex,
      snippet: chunk.content.slice(0, 240),
    }))

    const message = await saveDocumentAssistantMessage(turn.conversationId, response, citations)

    revalidatePath(`/student/documents/${parsed.data.documentId}`)

    return { success: true, data: { conversationId: turn.conversationId, message } }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Document chat is unavailable right now. Please try again." }
  }
}
