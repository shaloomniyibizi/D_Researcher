"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

import { ProjectVisibility, UserRole } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"

import { createStudentProject, updateStudentProject } from "./repositories/project-repository"
import type { CreateProjectActionResult } from "./types"

const createProjectSchema = z.object({
  title: z.string().trim().min(5, "Project title must be at least 5 characters.").max(180),
  abstract: z.string().trim().max(2_000).optional(),
  problemStatement: z.string().trim().max(3_000).optional(),
  objectives: z.string().trim().max(2_000).optional(),
  keywords: z.string().trim().max(500).optional(),
  visibility: z.enum(ProjectVisibility),
  supervisorId: z.string().trim().max(100).optional(),
})

function splitList(value: string | undefined, limit: number): string[] {
  if (!value) return []

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>|<\/li>|<\/div>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim()
}

function normalizeRichText(value: string | undefined): string | null {
  if (!value || !stripHtml(value)) return null
  return value
}

function splitRichTextList(value: string | undefined, limit: number): string[] {
  if (!value) return []

  return stripHtml(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
}

export async function createProject(input: unknown): Promise<CreateProjectActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== UserRole.STUDENT) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = createProjectSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid project details.",
    }
  }

  try {
    const result = await createStudentProject(session.user.id, {
      title: parsed.data.title,
      abstract: normalizeRichText(parsed.data.abstract),
      problemStatement: normalizeRichText(parsed.data.problemStatement),
      objectives: splitRichTextList(parsed.data.objectives, 12),
      keywords: splitList(parsed.data.keywords, 12),
      visibility: parsed.data.visibility,
      supervisorId: parsed.data.supervisorId || null,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.reason === "INVALID_SUPERVISOR"
          ? "Select a valid supervisor from your department."
          : "Complete onboarding before creating a project.",
      }
    }

    revalidatePath("/student")
    revalidatePath("/student/projects")

    return { success: true, data: { projectId: result.projectId } }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Could not create the project. Please try again." }
  }
}

export async function updateProject(projectId: string, input: unknown): Promise<CreateProjectActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== UserRole.STUDENT) {
    return { success: false, error: "Unauthorized" }
  }

  const projectIdResult = z.string().trim().min(1).max(100).safeParse(projectId)
  const parsed = createProjectSchema.safeParse(input)

  if (!projectIdResult.success || !parsed.success) {
    return {
      success: false,
      error: parsed.success
        ? "Invalid project."
        : parsed.error.issues[0]?.message ?? "Invalid project details.",
    }
  }

  try {
    const result = await updateStudentProject(session.user.id, projectIdResult.data, {
      title: parsed.data.title,
      abstract: normalizeRichText(parsed.data.abstract),
      problemStatement: normalizeRichText(parsed.data.problemStatement),
      objectives: splitRichTextList(parsed.data.objectives, 12),
      keywords: splitList(parsed.data.keywords, 12),
      visibility: parsed.data.visibility,
      supervisorId: parsed.data.supervisorId || null,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.reason === "INVALID_SUPERVISOR"
          ? "Select a valid supervisor from your department."
          : "This project cannot be edited.",
      }
    }

    revalidatePath("/student")
    revalidatePath("/student/projects")
    revalidatePath(`/student/projects/${projectIdResult.data}`)
    revalidatePath("/supervisor")
    revalidatePath("/supervisor/projects")
    revalidatePath(`/supervisor/projects/${projectIdResult.data}`)
    revalidatePath("/supervisor/notifications")

    return { success: true, data: { projectId: result.projectId } }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Could not update the project. Please try again." }
  }
}
