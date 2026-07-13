import prisma from "@/lib/prisma"
import { richTextToPlainText } from "@/lib/rich-text"

import type { SupervisorChapterReview } from "../types"

const CHAPTER_PREFIX = "[Chapter] "

function normalizeSelectionText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

export async function getSupervisorChapterReviews(supervisorId: string, projectId: string): Promise<SupervisorChapterReview[] | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, supervisorId, deletedAt: null },
    select: { id: true },
  })
  if (!project) return null

  const chapters = await prisma.researchDocument.findMany({
    where: { projectId, title: { startsWith: CHAPTER_PREFIX } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      wordCount: true,
      updatedAt: true,
      comments: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, body: true, selectionText: true, resolvedAt: true, createdAt: true, author: { select: { name: true } } },
      },
    },
  })

  return chapters.map((chapter) => ({ ...chapter, title: chapter.title.slice(CHAPTER_PREFIX.length), content: chapter.content ?? "" }))
}

export async function addSupervisorChapterComment(input: { supervisorId: string; projectId: string; chapterId: string; body: string; selectionText: string | null }): Promise<boolean> {
  return prisma.$transaction(async (db) => {
    const chapter = await db.researchDocument.findFirst({
      where: { id: input.chapterId, projectId: input.projectId, title: { startsWith: CHAPTER_PREFIX }, project: { supervisorId: input.supervisorId, deletedAt: null } },
      select: { id: true, content: true, project: { select: { ownerId: true, departmentId: true, title: true } } },
    })
    if (!chapter) return false
    if (input.selectionText) {
      const chapterText = normalizeSelectionText(richTextToPlainText(chapter.content))
      const selectionText = normalizeSelectionText(input.selectionText)
      if (!selectionText || !chapterText.includes(selectionText)) return false
    }

    await db.comment.create({ data: { projectId: input.projectId, documentId: chapter.id, authorId: input.supervisorId, body: input.body, selectionText: input.selectionText } })
    await db.researchDocument.update({ where: { id: chapter.id }, data: { status: "IN_REVIEW", lockedAt: null } })
    await db.notification.create({ data: { userId: chapter.project.ownerId, departmentId: chapter.project.departmentId, channel: "IN_APP", title: "Chapter changes requested", body: `Your supervisor commented on a chapter in ${chapter.project.title}.`, actionUrl: `/student/projects/${input.projectId}` } })
    return true
  })
}

export async function approveSupervisorChapter(input: { supervisorId: string; projectId: string; chapterId: string }): Promise<"APPROVED" | "UNRESOLVED" | "NOT_FOUND"> {
  return prisma.$transaction(async (db) => {
    const chapter = await db.researchDocument.findFirst({
      where: { id: input.chapterId, projectId: input.projectId, title: { startsWith: CHAPTER_PREFIX }, wordCount: { gt: 0 }, project: { supervisorId: input.supervisorId, deletedAt: null } },
      select: { id: true, title: true, project: { select: { ownerId: true, departmentId: true, title: true } }, comments: { where: { resolvedAt: null }, take: 1, select: { id: true } } },
    })
    if (!chapter) return "NOT_FOUND"
    if (chapter.comments.length > 0) return "UNRESOLVED"

    await db.researchDocument.update({ where: { id: chapter.id }, data: { status: "APPROVED", lockedAt: new Date() } })
    await db.notification.create({ data: { userId: chapter.project.ownerId, departmentId: chapter.project.departmentId, channel: "IN_APP", title: "Chapter approved", body: `${chapter.title.slice(CHAPTER_PREFIX.length)} was approved for ${chapter.project.title}.`, actionUrl: `/student/projects/${input.projectId}` } })
    return "APPROVED"
  })
}

export async function resolveStudentChapterComment(input: { userId: string; projectId: string; chapterId: string; commentId: string }): Promise<boolean> {
  const comment = await prisma.comment.findFirst({
    where: { id: input.commentId, documentId: input.chapterId, projectId: input.projectId, resolvedAt: null, project: { deletedAt: null, OR: [{ ownerId: input.userId }, { members: { some: { userId: input.userId, joinedAt: { not: null } } } }] } },
    select: { id: true },
  })
  if (!comment) return false
  await prisma.comment.update({ where: { id: comment.id }, data: { resolvedAt: new Date() } })
  return true
}
