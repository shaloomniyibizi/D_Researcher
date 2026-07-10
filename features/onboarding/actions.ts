"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { UserRole } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"

import {
  updateOnboardingProfile,
} from "./repositories/onboarding-repository"
import type { OnboardingActionState } from "./types"

const onboardingSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    departmentId: z.string().trim().min(1, "Select a valid department.").max(100),
    studentNumber: z.string().trim().max(50).optional(),
    staffNumber: z.string().trim().max(50).optional(),
    bio: z.string().trim().max(500, "Bio must be 500 characters or fewer.").optional(),
    researchInterests: z.string().trim().max(500).optional(),
  })

function splitResearchInterests(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(",")
    .map((interest) => interest.trim())
    .filter((interest) => interest.length > 0)
    .slice(0, 12)
}

export async function completeOnboarding(
  input: unknown,
): Promise<OnboardingActionState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return { success: false, error: "Unauthorized" }
  }

  const parsed = onboardingSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid onboarding details.",
    }
  }

  try {
    const role = session.user.role
    const institutionalNumber = role === UserRole.STUDENT
      ? parsed.data.studentNumber
      : parsed.data.staffNumber

    if (!institutionalNumber) {
      return {
        success: false,
        error: role === UserRole.STUDENT
          ? "Student number is required."
          : "Staff number is required.",
      }
    }

    const updatedUser = await updateOnboardingProfile({
      userId: session.user.id,
      name: parsed.data.name,
      departmentId: parsed.data.departmentId,
      studentNumber: role === UserRole.STUDENT ? institutionalNumber : null,
      staffNumber: role === UserRole.STUDENT ? null : institutionalNumber,
      bio: parsed.data.bio || null,
      researchInterests: splitResearchInterests(parsed.data.researchInterests),
    })

    if (!updatedUser) {
      return { success: false, error: "Select a valid department." }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error(error)

    return { success: false, error: "Could not save onboarding details." }
  }
}
