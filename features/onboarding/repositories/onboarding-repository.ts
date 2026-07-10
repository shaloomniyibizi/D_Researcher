import prisma from "@/lib/prisma"

import type { DepartmentOption, OnboardingPageData } from "../types"

export async function getOnboardingPageData(
  userId: string,
): Promise<OnboardingPageData | null> {
  const [user, departments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        departmentId: true,
        studentNumber: true,
        staffNumber: true,
        bio: true,
        researchInterests: true,
        onboardingCompletedAt: true,
      },
    }),
    prisma.department.findMany({
      orderBy: [{ institution: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        institution: {
          select: {
            name: true,
          },
        },
      },
      take: 100,
    }),
  ])

  if (!user) {
    return null
  }

  return {
    user,
    departments: departments.map((department): DepartmentOption => ({
      id: department.id,
      name: department.name,
      code: department.code,
      institutionName: department.institution.name,
    })),
  }
}

export async function updateOnboardingProfile(input: {
  userId: string
  name: string
  departmentId: string
  studentNumber: string | null
  staffNumber: string | null
  bio: string | null
  researchInterests: string[]
}) {
  return prisma.$transaction(async (db) => {
    const department = await db.department.findUnique({
      where: { id: input.departmentId },
      select: { id: true },
    })

    if (!department) {
      return null
    }

    return db.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        departmentId: input.departmentId,
        studentNumber: input.studentNumber,
        staffNumber: input.staffNumber,
        bio: input.bio,
        researchInterests: input.researchInterests,
        onboardingCompletedAt: new Date(),
        lastActiveAt: new Date(),
      },
      select: {
        id: true,
        role: true,
      },
    })
  })
}
