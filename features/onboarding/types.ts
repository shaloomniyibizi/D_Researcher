import type { UserRole } from "@/generated/prisma/client"

export type DepartmentOption = {
  id: string
  name: string
  code: string
  institutionName: string
}

export type OnboardingProfile = {
  id: string
  name: string
  email: string
  image: string | null
  role: UserRole
  departmentId: string | null
  studentNumber: string | null
  staffNumber: string | null
  bio: string | null
  researchInterests: string[]
  onboardingCompletedAt: Date | null
}

export type OnboardingPageData = {
  user: OnboardingProfile
  departments: DepartmentOption[]
}

export type OnboardingActionState = {
  success: boolean
  error: string | null
}
