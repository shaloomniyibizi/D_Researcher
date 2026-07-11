import type { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"
import type { FeedbackStatusFilter, SupervisorFeedbackPageData } from "../types"

const PAGE_SIZE = 12

export async function getSupervisorFeedbackPage(input: { supervisorId: string; query: string; status: FeedbackStatusFilter; page: number }): Promise<SupervisorFeedbackPageData> {
  const projectScope: Prisma.ProjectWhereInput = { supervisorId: input.supervisorId, deletedAt: null }
  const baseWhere: Prisma.FeedbackWhereInput = { authorId: input.supervisorId, project: projectScope }
  const queryWhere: Prisma.FeedbackWhereInput = input.query ? { OR: [{ body: { contains: input.query, mode: "insensitive" } }, { project: { title: { contains: input.query, mode: "insensitive" } } }, { project: { owner: { name: { contains: input.query, mode: "insensitive" } } } }] } : {}
  const statusWhere: Prisma.FeedbackWhereInput = input.status === "open" ? { resolvedAt: null } : input.status === "resolved" ? { resolvedAt: { not: null } } : {}
  const where = { AND: [baseWhere, queryWhere, statusWhere] } satisfies Prisma.FeedbackWhereInput
  const [all, open, resolved, filteredCount] = await Promise.all([
    prisma.feedback.count({ where: baseWhere }),
    prisma.feedback.count({ where: { ...baseWhere, resolvedAt: null } }),
    prisma.feedback.count({ where: { ...baseWhere, resolvedAt: { not: null } } }),
    prisma.feedback.count({ where }),
  ])
  const pageCount = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const page = Math.min(input.page, pageCount)
  const items = await prisma.feedback.findMany({
    where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
    select: { id: true, body: true, createdAt: true, resolvedAt: true, activityLogId: true, project: { select: { id: true, title: true, owner: { select: { name: true, image: true, studentNumber: true } } } }, submission: { select: { id: true, title: true } }, document: { select: { id: true, title: true } } },
  })
  return { items, totals: { all, open, resolved }, page, pageCount }
}
