import mammoth from "mammoth"
import { extractPdfText } from "@/features/knowledge-base/services/pdf-ingestion"
import prisma from "@/lib/prisma"

export async function importChapterFile(input: { userId: string; chapterId: string; key: string; url: string; name: string; size: number; mimeType: string }) {
  const chapter = await prisma.researchDocument.findFirst({ where: { id: input.chapterId, title: { startsWith: "[Chapter] " }, project: { deletedAt: null, OR: [{ ownerId: input.userId }, { members: { some: { userId: input.userId, joinedAt: { not: null } } } }] } }, select: { id: true, projectId: true } })
  if (!chapter) return { success: false as const }
  const response = await fetch(input.url)
  if (!response.ok) return { success: false as const }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  let content = ""
  if (input.mimeType === "application/pdf") content = (await extractPdfText(arrayBuffer)).text
  else content = (await mammoth.extractRawText({ buffer })).value
  const clean = content.trim().slice(0, 500_000)
  await prisma.$transaction([
    prisma.uploadedFile.create({ data: { projectId: chapter.projectId, documentId: chapter.id, uploadedById: input.userId, key: input.key, url: input.url, name: input.name, mimeType: input.mimeType, sizeBytes: input.size } }),
    prisma.researchDocument.update({ where: { id: chapter.id }, data: { content: clean, wordCount: clean ? clean.split(/\s+/).length : 0, status: clean ? "IN_REVIEW" : "DRAFT", lockedAt: null } }),
  ])
  return { success: true as const, projectId: chapter.projectId }
}
