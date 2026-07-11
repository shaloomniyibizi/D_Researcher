"use server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { UserRole } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { addChapter, deleteChapter, saveChapter } from "./repositories/chapter-repository"
import type { ChapterResult } from "./types"

const id = z.string().cuid()
async function studentId() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user.role === UserRole.STUDENT ? session.user.id : null }
export async function createChapter(input: unknown): Promise<ChapterResult> { const userId = await studentId(); if (!userId) return { success: false, error: "Unauthorized" }; const parsed = z.object({ projectId: id, title: z.string().trim().min(2).max(120) }).safeParse(input); if (!parsed.success) return { success: false, error: "Enter a valid chapter title." }; try { const chapter = await addChapter(userId, parsed.data.projectId, parsed.data.title); if (!chapter) return { success: false, error: "Project not found." }; revalidatePath(`/student/projects/${parsed.data.projectId}`); return { success: true, data: { chapterId: chapter.id } } } catch (error) { console.error(error); return { success: false, error: "Could not add the chapter." } } }
export async function updateChapter(input: unknown): Promise<ChapterResult> { const userId = await studentId(); if (!userId) return { success: false, error: "Unauthorized" }; const parsed = z.object({ projectId: id, chapterId: id, title: z.string().trim().min(2).max(120), content: z.string().max(500_000) }).safeParse(input); if (!parsed.success) return { success: false, error: "Chapter content is invalid." }; try { const chapter = await saveChapter(userId, parsed.data.chapterId, parsed.data.title, parsed.data.content); if (!chapter) return { success: false, error: "Chapter not found." }; revalidatePath(`/student/projects/${parsed.data.projectId}`); return { success: true, data: { chapterId: chapter.id } } } catch (error) { console.error(error); return { success: false, error: "Could not save the chapter." } } }
export async function removeChapter(input: unknown): Promise<ChapterResult> { const userId = await studentId(); if (!userId) return { success: false, error: "Unauthorized" }; const parsed = z.object({ projectId: id, chapterId: id }).safeParse(input); if (!parsed.success) return { success: false, error: "Invalid chapter." }; try { if (!await deleteChapter(userId, parsed.data.chapterId)) return { success: false, error: "Only the project owner can delete chapters." }; revalidatePath(`/student/projects/${parsed.data.projectId}`); return { success: true } } catch (error) { console.error(error); return { success: false, error: "Could not delete the chapter." } } }
