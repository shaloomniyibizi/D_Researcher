"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

import { addSupervisorChapterComment, approveSupervisorChapter, resolveStudentChapterComment } from "./repositories/chapter-review-repository"
import type { ChapterReviewResult } from "./types"

const idSchema = z.string().cuid()
const chapterSchema = z.object({ projectId: idSchema, chapterId: idSchema })

function revalidateReviewPaths(projectId: string) {
  revalidatePath(`/student/projects/${projectId}`)
  revalidatePath(`/supervisor/projects/${projectId}`)
  revalidatePath("/student")
  revalidatePath("/student/projects")
  revalidatePath("/supervisor")
}

export async function addChapterReviewComment(input: unknown): Promise<ChapterReviewResult> {
  const session = await getServerSession(await headers())
  if (!session || session.user.role !== UserRole.SUPERVISOR) return { success: false, error: "Unauthorized" }
  const parsed = chapterSchema.extend({ body: z.string().trim().min(2).max(2_000), selectionText: z.string().trim().max(500).nullable() }).safeParse(input)
  if (!parsed.success) return { success: false, error: "Enter a valid chapter comment." }
  try {
    const added = await addSupervisorChapterComment({ supervisorId: session.user.id, ...parsed.data })
    if (!added) return { success: false, error: "The selected chapter text is no longer current. Refresh and try again." }
    revalidateReviewPaths(parsed.data.projectId)
    return { success: true }
  } catch (error) { console.error("Could not add chapter review comment.", error); return { success: false, error: "Could not save the chapter comment." } }
}

export async function approveChapterReview(input: unknown): Promise<ChapterReviewResult> {
  const session = await getServerSession(await headers())
  if (!session || session.user.role !== UserRole.SUPERVISOR) return { success: false, error: "Unauthorized" }
  const parsed = chapterSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid chapter." }
  try {
    const result = await approveSupervisorChapter({ supervisorId: session.user.id, ...parsed.data })
    if (result === "UNRESOLVED") return { success: false, error: "Resolve all requested changes before approving this chapter." }
    if (result === "NOT_FOUND") return { success: false, error: "This chapter is not available for approval." }
    revalidateReviewPaths(parsed.data.projectId)
    return { success: true }
  } catch (error) { console.error("Could not approve chapter.", error); return { success: false, error: "Could not approve the chapter." } }
}

export async function resolveChapterReviewComment(input: unknown): Promise<ChapterReviewResult> {
  const session = await getServerSession(await headers())
  if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }
  const parsed = chapterSchema.extend({ commentId: idSchema }).safeParse(input)
  if (!parsed.success) return { success: false, error: "Invalid chapter comment." }
  try {
    if (!await resolveStudentChapterComment({ userId: session.user.id, ...parsed.data })) return { success: false, error: "Chapter comment not found." }
    revalidateReviewPaths(parsed.data.projectId)
    return { success: true }
  } catch (error) { console.error("Could not resolve chapter comment.", error); return { success: false, error: "Could not update the chapter comment." } }
}
