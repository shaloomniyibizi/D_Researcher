"use server"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"
import { resolveStudentFeedback, respondToStudentFeedback } from "./repositories/student-feedback-repository"
type Result = { success: true } | { success: false; error: string }
const idSchema = z.string().trim().min(1).max(100)
export async function replyToFeedback(input: unknown): Promise<Result> { const session = await getServerSession(await headers()); if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }; const parsed = z.object({ feedbackId: idSchema, body: z.string().trim().min(2).max(2_000) }).safeParse(input); if (!parsed.success) return { success: false, error: "Enter a valid response." }; try { if (!await respondToStudentFeedback({ userId: session.user.id, ...parsed.data })) return { success: false, error: "Feedback not found." }; revalidatePath("/student/feedback"); revalidatePath("/supervisor/feedback"); return { success: true } } catch (error) { console.error(error); return { success: false, error: "Could not send response." } } }
export async function markFeedbackAddressed(input: unknown): Promise<Result> { const session = await getServerSession(await headers()); if (!session || session.user.role !== UserRole.STUDENT) return { success: false, error: "Unauthorized" }; const parsed = z.object({ feedbackId: idSchema }).safeParse(input); if (!parsed.success) return { success: false, error: "Invalid feedback." }; try { if (!await resolveStudentFeedback({ userId: session.user.id, ...parsed.data })) return { success: false, error: "Feedback not found." }; revalidatePath("/student/feedback"); revalidatePath("/supervisor/feedback"); return { success: true } } catch (error) { console.error(error); return { success: false, error: "Could not update feedback." } } }
