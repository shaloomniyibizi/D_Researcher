import { createHash } from "crypto"

import { AiJobStatus, AiJobType } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import { embedTexts, isEmbeddingConfigured } from "@/lib/embeddings"
import { isPineconeConfigured, upsertKnowledgeVectors } from "@/lib/pinecone"

import {
  createPendingKnowledgeDocument,
  findExistingDocumentByHash,
  markDocumentEmpty,
  markDocumentFailed,
  markDocumentProcessing,
  saveIngestedChunks,
} from "../repositories/knowledge-document-repository"
import type { IngestDocumentResult } from "../types"
import { chunkText, estimateTokenCount, extractPdfText, MAX_DOCUMENT_TOKENS, MIN_EXTRACTED_CHARS } from "./pdf-ingestion"

async function getStudentDepartment(userId: string): Promise<string | null> {
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", status: "ACTIVE", departmentId: { not: null } },
    select: { departmentId: true },
  })

  return student?.departmentId ?? null
}

export async function ingestKnowledgeDocument(input: {
  userId: string
  key: string
  url: string
  name: string
  size: number
}): Promise<IngestDocumentResult> {
  const departmentId = await getStudentDepartment(input.userId)
  if (!departmentId) {
    return { success: false, error: "Student profile is not set up yet." }
  }

  if (!isPineconeConfigured || !isEmbeddingConfigured) {
    return { success: false, error: "Document chat is not configured on this server yet." }
  }

  const { documentId } = await createPendingKnowledgeDocument({
    userId: input.userId,
    departmentId,
    uploadedFile: {
      key: input.key,
      url: input.url,
      name: input.name,
      sizeBytes: input.size,
      mimeType: "application/pdf",
    },
  })

  const job = await prisma.aiJob.create({
    data: {
      requestedById: input.userId,
      type: AiJobType.RAG_INGESTION,
      status: AiJobStatus.RUNNING,
      input: { documentId, name: input.name },
      startedAt: new Date(),
    },
    select: { id: true },
  })

  try {
    await markDocumentProcessing(documentId)

    const response = await fetch(input.url)
    if (!response.ok) {
      throw new Error(`Could not download the uploaded file (status ${response.status}).`)
    }
    const fileBuffer = await response.arrayBuffer()

    const { text } = await extractPdfText(fileBuffer)

    if (text.length < MIN_EXTRACTED_CHARS) {
      await markDocumentEmpty(documentId)
      await prisma.aiJob.update({
        where: { id: job.id },
        data: { status: AiJobStatus.SUCCEEDED, completedAt: new Date(), output: { chunkCount: 0, reason: "empty" } },
      })
      return { success: true, documentId }
    }

    const textHash = createHash("sha256").update(text).digest("hex")
    const existingDocumentId = await findExistingDocumentByHash(input.userId, textHash)
    if (existingDocumentId && existingDocumentId !== documentId) {
      await markDocumentFailed(documentId, "This PDF has already been uploaded.")
      await prisma.aiJob.update({
        where: { id: job.id },
        data: { status: AiJobStatus.SUCCEEDED, completedAt: new Date(), output: { duplicateOf: existingDocumentId } },
      })
      return { success: true, documentId: existingDocumentId }
    }

    const totalTokens = estimateTokenCount(text)
    if (totalTokens > MAX_DOCUMENT_TOKENS) {
      throw new Error("This PDF is too large to process. Try a shorter document.")
    }

    const chunks = chunkText(text)
    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content))

    const vectorRecords = chunks.map((chunk, index) => ({
      id: `${documentId}::${chunk.chunkIndex}`,
      values: embeddings[index] ?? [],
      metadata: { userId: input.userId, documentId, chunkIndex: chunk.chunkIndex, role: "STUDENT" },
    }))

    await upsertKnowledgeVectors(vectorRecords)

    await saveIngestedChunks({
      documentId,
      textHash,
      tokenCount: totalTokens,
      chunks: chunks.map((chunk, index) => ({ ...chunk, vectorId: vectorRecords[index]?.id ?? "" })),
    })

    await prisma.aiJob.update({
      where: { id: job.id },
      data: { status: AiJobStatus.SUCCEEDED, completedAt: new Date(), output: { chunkCount: chunks.length } },
    })

    return { success: true, documentId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process this document."
    console.error(error)
    await markDocumentFailed(documentId, message)
    await prisma.aiJob.update({
      where: { id: job.id },
      data: { status: AiJobStatus.FAILED, completedAt: new Date(), error: message },
    })
    return { success: false, error: message }
  }
}
