import prisma from "@/lib/prisma"

import type { KnowledgeDocumentDetail, KnowledgeDocumentSummary } from "../types"

async function getStudentDepartment(userId: string): Promise<string | null> {
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", status: "ACTIVE", departmentId: { not: null } },
    select: { departmentId: true },
  })

  return student?.departmentId ?? null
}

export async function listStudentDocuments(userId: string): Promise<KnowledgeDocumentSummary[] | null> {
  const departmentId = await getStudentDepartment(userId)
  if (!departmentId) return null

  return prisma.knowledgeDocument.findMany({
    where: { departmentId, uploadedFile: { uploadedById: userId } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      errorMessage: true,
      tokenCount: true,
      createdAt: true,
      indexedAt: true,
    },
  })
}

export async function getStudentDocument(
  userId: string,
  documentId: string,
): Promise<KnowledgeDocumentDetail | null> {
  const departmentId = await getStudentDepartment(userId)
  if (!departmentId) return null

  return prisma.knowledgeDocument.findFirst({
    where: { id: documentId, departmentId, uploadedFile: { uploadedById: userId } },
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
}

export async function findExistingDocumentByHash(
  userId: string,
  textHash: string,
): Promise<string | null> {
  const existing = await prisma.knowledgeDocument.findFirst({
    where: { textHash, uploadedFile: { uploadedById: userId } },
    select: { id: true },
  })

  return existing?.id ?? null
}

export async function createPendingKnowledgeDocument(input: {
  userId: string
  departmentId: string
  uploadedFile: { key: string; url: string; name: string; sizeBytes: number; mimeType: string }
}): Promise<{ documentId: string }> {
  return prisma.$transaction(async (db) => {
    const uploadedFile = await db.uploadedFile.create({
      data: {
        uploadedById: input.userId,
        key: input.uploadedFile.key,
        url: input.uploadedFile.url,
        name: input.uploadedFile.name,
        mimeType: input.uploadedFile.mimeType,
        sizeBytes: input.uploadedFile.sizeBytes,
      },
      select: { id: true },
    })

    const title = input.uploadedFile.name.replace(/\.pdf$/i, "").trim() || input.uploadedFile.name

    const document = await db.knowledgeDocument.create({
      data: {
        departmentId: input.departmentId,
        uploadedFileId: uploadedFile.id,
        title,
        status: "PENDING",
      },
      select: { id: true },
    })

    await db.activityLog.create({
      data: {
        actorId: input.userId,
        departmentId: input.departmentId,
        action: "knowledge_document.uploaded",
        entityType: "KnowledgeDocument",
        entityId: document.id,
        metadata: { title },
      },
    })

    return { documentId: document.id }
  })
}

export async function markDocumentProcessing(documentId: string): Promise<void> {
  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  })
}

export async function saveIngestedChunks(input: {
  documentId: string
  textHash: string
  tokenCount: number
  chunks: Array<{ chunkIndex: number; content: string; tokenCount: number; vectorId: string }>
}): Promise<void> {
  await prisma.$transaction(async (db) => {
    await db.knowledgeChunk.createMany({
      data: input.chunks.map((chunk) => ({
        knowledgeDocumentId: input.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        vectorId: chunk.vectorId,
      })),
    })

    await db.knowledgeDocument.update({
      where: { id: input.documentId },
      data: {
        status: "INDEXED",
        indexedAt: new Date(),
        tokenCount: input.tokenCount,
        textHash: input.textHash,
        errorMessage: null,
      },
    })
  })
}

export async function markDocumentFailed(documentId: string, errorMessage: string): Promise<void> {
  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: "FAILED", errorMessage },
  })
}

export async function markDocumentEmpty(documentId: string): Promise<void> {
  await prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: "EMPTY", indexedAt: null, errorMessage: null },
  })
}

export async function deleteStudentDocument(
  userId: string,
  documentId: string,
): Promise<{ success: true; uploadedFileKey: string | null } | { success: false; reason: "NOT_FOUND" }> {
  return prisma.$transaction(async (db) => {
    const document = await db.knowledgeDocument.findFirst({
      where: { id: documentId, uploadedFile: { uploadedById: userId } },
      select: { id: true, departmentId: true, uploadedFileId: true, uploadedFile: { select: { key: true } } },
    })

    if (!document) return { success: false, reason: "NOT_FOUND" as const }

    await db.knowledgeDocument.delete({ where: { id: document.id } })

    if (document.uploadedFileId) {
      await db.uploadedFile.deleteMany({ where: { id: document.uploadedFileId } })
    }

    await db.activityLog.create({
      data: {
        actorId: userId,
        departmentId: document.departmentId,
        action: "knowledge_document.deleted",
        entityType: "KnowledgeDocument",
        entityId: document.id,
      },
    })

    return { success: true, uploadedFileKey: document.uploadedFile?.key ?? null }
  })
}
