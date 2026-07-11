"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"
import { addSupervisorChangeFeedback } from "./repositories/project-review-repository"
import type { AddChangeFeedbackResult } from "./types"

const schema = z.object({ projectId: z.string().trim().min(1).max(100), activityLogId: z.string().trim().min(1).max(100), body: z.string().trim().min(2, "Enter feedback.").max(2_000) })

export async function addChangeFeedback(input: unknown): Promise<AddChangeFeedbackResult> {
  const session = await getServerSession(await headers())
  if (!session || session.user.role !== UserRole.SUPERVISOR) return { success: false, error: "Unauthorized" }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid feedback." }
  try {
    const added = await addSupervisorChangeFeedback({ supervisorId: session.user.id, ...parsed.data })
    if (!added) return { success: false, error: "This change is not available for review." }
    revalidatePath(`/supervisor/projects/${parsed.data.projectId}`)
    revalidatePath(`/student/projects/${parsed.data.projectId}`)
    return { success: true }
  } catch (error) { console.error("Could not add supervisor feedback.", error); return { success: false, error: "Could not save feedback." } }
}
