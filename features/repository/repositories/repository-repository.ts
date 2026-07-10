import prisma from "@/lib/prisma"

import type { RepositoryFilters, StudentRepositoryData } from "../types"

const PAGE_SIZE = 12

export async function getStudentRepository(
  userId: string,
  filters: RepositoryFilters,
): Promise<StudentRepositoryData | null> {
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", status: "ACTIVE" },
    select: {
      department: {
        select: {
          id: true,
          institution: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!student?.department) return null

  const institutionId = student.department.institution.id
  const where = {
    institutionId,
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.year ? { year: filters.year } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" as const } },
            { abstract: { contains: filters.query, mode: "insensitive" as const } },
            { supervisorName: { contains: filters.query, mode: "insensitive" as const } },
            { authors: { has: filters.query } },
            { technologies: { has: filters.query } },
          ],
        }
      : {}),
  }

  const [records, total, departments, yearRows, typeGroups] = await Promise.all([
    prisma.repositoryRecord.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        title: true,
        abstract: true,
        authors: true,
        year: true,
        technologies: true,
        supervisorName: true,
        fileUrl: true,
        externalUrl: true,
        publishedAt: true,
        department: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.repositoryRecord.count({ where }),
    prisma.department.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, code: true },
    }),
    prisma.repositoryRecord.findMany({
      where: { institutionId, year: { not: null } },
      distinct: ["year"],
      orderBy: { year: "desc" },
      take: 50,
      select: { year: true },
    }),
    prisma.repositoryRecord.groupBy({
      by: ["type"],
      where: { institutionId },
      _count: { _all: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return {
    records,
    total,
    page: Math.min(filters.page, totalPages),
    pageSize: PAGE_SIZE,
    totalPages,
    institution: student.department.institution,
    departments,
    years: yearRows.flatMap((row) => (row.year === null ? [] : [row.year])),
    countsByType: Object.fromEntries(
      typeGroups.map((group) => [group.type, group._count._all]),
    ),
  }
}
