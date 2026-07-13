import prisma from "@/lib/prisma"
import { richTextToPlainText } from "@/lib/rich-text"
import type { ProjectChapter } from "../types"

const DEFAULT_CHAPTERS = ["Introduction", "Literature Review", "Methodology", "Results", "Discussion", "Conclusion and Recommendations"] as const
const CHAPTER_PREFIX = "[Chapter] "

function access(userId: string, projectId: string) {
  return { id: projectId, deletedAt: null, OR: [{ ownerId: userId }, { members: { some: { userId, joinedAt: { not: null } } } }] }
}

export async function getProjectChapters(userId: string, projectId: string): Promise<ProjectChapter[] | null> {
  const project = await prisma.project.findFirst({ where: access(userId, projectId), select: { id: true } })
  if (!project) return null
  const count = await prisma.researchDocument.count({ where: { projectId, title: { startsWith: CHAPTER_PREFIX } } })
  if (count === 0) await prisma.researchDocument.createMany({ data: DEFAULT_CHAPTERS.map((title) => ({ projectId, createdById: userId, title: `${CHAPTER_PREFIX}${title}`, isChapter: true, type: title === "Literature Review" ? "LITERATURE_REVIEW" : title === "Methodology" ? "METHODOLOGY" : "FINAL_REPORT" })) })
  return prisma.researchDocument.findMany({ where: { projectId, title: { startsWith: CHAPTER_PREFIX } }, orderBy: { createdAt: "asc" }, take: 50, select: { id: true, title: true, content: true, status: true, wordCount: true, updatedAt: true, files: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, name: true, url: true, mimeType: true, sizeBytes: true } }, comments: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, body: true, selectionText: true, resolvedAt: true, createdAt: true, author: { select: { name: true } } } } } }).then((items) => items.map((item, sortOrder) => ({ ...item, title: item.title.slice(CHAPTER_PREFIX.length), sortOrder, content: item.content ?? "" })))
}

export async function addChapter(userId: string, projectId: string, title: string) {
  const project = await prisma.project.findFirst({ where: access(userId, projectId), select: { id: true } })
  if (!project) return null
  return prisma.researchDocument.create({ data: { projectId, createdById: userId, title: `${CHAPTER_PREFIX}${title}`, isChapter: true, type: "OTHER" }, select: { id: true } })
}

export async function saveChapter(userId: string, chapterId: string, title: string, content: string) {
  const chapter = await prisma.researchDocument.findFirst({ where: { id: chapterId, title: { startsWith: CHAPTER_PREFIX }, project: { deletedAt: null, OR: [{ ownerId: userId }, { members: { some: { userId, joinedAt: { not: null } } } }] } }, select: { id: true } })
  if (!chapter) return null
  const plainContent = richTextToPlainText(content)
  const wordCount = plainContent ? plainContent.split(/\s+/).length : 0
  return prisma.researchDocument.update({ where: { id: chapter.id }, data: { title: `${CHAPTER_PREFIX}${title}`, content, wordCount, status: plainContent ? "IN_REVIEW" : "DRAFT", lockedAt: null }, select: { id: true } })
}

export async function deleteChapter(userId: string, chapterId: string) {
  return prisma.researchDocument.deleteMany({ where: { id: chapterId, title: { startsWith: CHAPTER_PREFIX }, project: { ownerId: userId, deletedAt: null } } }).then((result) => result.count > 0)
}
