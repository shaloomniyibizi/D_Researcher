import prisma from "@/lib/prisma"

import type { RepositoryFilters, StudentRepositoryData } from "../types"
import type { PublishableProject } from "../types"

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

export async function getPublishableProjects(userId: string): Promise<PublishableProject[] | null> {
  const student = await prisma.user.findFirst({ where: { id: userId, role: "STUDENT", status: "ACTIVE", departmentId: { not: null } }, select: { departmentId: true } })
  if (!student?.departmentId) return null
  const projects = await prisma.project.findMany({ where: { ownerId: userId, departmentId: student.departmentId, deletedAt: null }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, title: true, status: true, repositoryRecord: { select: { id: true } } } })
  return projects.map(({ repositoryRecord, ...project }) => ({ ...project, alreadyPublished: Boolean(repositoryRecord) }))
}

export async function publishPastProject(input: { userId: string; projectId: string; year: number; technologies: string[]; externalUrl: string | null }) {
  return prisma.$transaction(async (db) => {
    const project = await db.project.findFirst({ where: { id: input.projectId, ownerId: input.userId, deletedAt: null, repositoryRecord: null, owner: { role: "STUDENT", status: "ACTIVE", departmentId: { not: null } } }, select: { id: true, title: true, abstract: true, keywords: true, departmentId: true, department: { select: { institutionId: true } }, owner: { select: { name: true } }, supervisor: { select: { name: true } } } })
    if (!project) return null
    const record = await db.repositoryRecord.create({ data: { institutionId: project.department.institutionId, departmentId: project.departmentId, projectId: project.id, createdById: input.userId, type: "PAST_PROJECT", title: project.title, abstract: project.abstract, authors: [project.owner.name], year: input.year, technologies: input.technologies.length ? input.technologies : project.keywords, supervisorName: project.supervisor?.name ?? null, fileUrl: `/student/projects/${project.id}/export?format=pdf`, externalUrl: input.externalUrl, publishedAt: new Date(), metadata: { source: "student-project" } }, select: { id: true } })
    await db.activityLog.create({ data: { actorId: input.userId, departmentId: project.departmentId, projectId: project.id, action: "repository.published", entityType: "RepositoryRecord", entityId: record.id, metadata: { year: input.year } } })
    return record
  })
}
