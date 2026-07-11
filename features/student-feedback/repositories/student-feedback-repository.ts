import prisma from "@/lib/prisma"

export function getStudentFeedback(userId: string) {
  return prisma.feedback.findMany({
    where: { project: { OR: [{ ownerId: userId }, { members: { some: { userId, joinedAt: { not: null } } } }], deletedAt: null } },
    orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, body: true, createdAt: true, resolvedAt: true, project: { select: { id: true, title: true, supervisorId: true } }, author: { select: { name: true, image: true } }, replies: { orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, author: { select: { id: true, name: true, image: true } } } } },
  })
}

export async function respondToStudentFeedback(input: { userId: string; feedbackId: string; body: string }) {
  return prisma.$transaction(async (db) => {
    const feedback = await db.feedback.findFirst({ where: { id: input.feedbackId, project: { OR: [{ ownerId: input.userId }, { members: { some: { userId: input.userId, joinedAt: { not: null } } } }], deletedAt: null } }, select: { id: true, projectId: true, project: { select: { title: true, supervisorId: true } } } })
    if (!feedback) return false
    await db.feedbackReply.create({ data: { feedbackId: feedback.id, authorId: input.userId, body: input.body } })
    if (feedback.project.supervisorId) await db.notification.create({ data: { userId: feedback.project.supervisorId, channel: "IN_APP", title: "Student responded to feedback", body: `A student responded to your feedback on ${feedback.project.title}.`, actionUrl: `/supervisor/feedback` } })
    return true
  })
}

export async function resolveStudentFeedback(input: { userId: string; feedbackId: string }) {
  return prisma.$transaction(async (db) => {
    const feedback = await db.feedback.findFirst({ where: { id: input.feedbackId, resolvedAt: null, project: { OR: [{ ownerId: input.userId }, { members: { some: { userId: input.userId, joinedAt: { not: null } } } }], deletedAt: null } }, select: { id: true, project: { select: { title: true, supervisorId: true } } } })
    if (!feedback) return false
    await db.feedback.update({ where: { id: feedback.id }, data: { resolvedAt: new Date() } })
    if (feedback.project.supervisorId) await db.notification.create({ data: { userId: feedback.project.supervisorId, channel: "IN_APP", title: "Feedback marked addressed", body: `Your feedback on ${feedback.project.title} was marked addressed.`, actionUrl: "/supervisor/feedback" } })
    return true
  })
}
