import prisma from "@/lib/prisma"

import type { SupervisorDashboardData, SupervisorProfile } from "../types"

const profileSelect = {
  id: true, name: true, email: true, image: true, staffNumber: true,
  department: { select: { id: true, name: true, code: true, institution: { select: { name: true } } } },
} as const

export function getSupervisorProfile(userId: string): Promise<SupervisorProfile | null> {
  return prisma.user.findFirst({
    where: { id: userId, role: "SUPERVISOR", status: "ACTIVE" },
    select: profileSelect,
  })
}

export async function getSupervisorDashboardData(userId: string): Promise<SupervisorDashboardData | null> {
  const profile = await getSupervisorProfile(userId)
  if (!profile?.department) return null

  const projectWhere = { supervisorId: userId, departmentId: profile.department.id, deletedAt: null }
  const [projects, submissions, meetings, unreadNotifications] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true, title: true, status: true, updatedAt: true,
        owner: { select: { name: true, image: true, studentNumber: true } },
        milestones: {
          where: { status: { not: "APPROVED" } },
          orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { title: true, status: true, dueAt: true },
        },
        _count: { select: { submissions: true, documents: true, tasks: true } },
      },
    }),
    prisma.submission.findMany({
      where: { project: projectWhere, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { submittedAt: "desc" },
      take: 6,
      select: {
        id: true, title: true, status: true, submittedAt: true,
        project: { select: { id: true, title: true } },
        submittedBy: { select: { name: true, image: true } },
      },
    }),
    prisma.meeting.findMany({
      where: { project: projectWhere, status: "SCHEDULED", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: {
        id: true, title: true, startsAt: true, meetingUrl: true,
        project: { select: { id: true, title: true, owner: { select: { name: true } } } },
      },
    }),
    prisma.notification.count({
      where: { userId, status: "UNREAD", OR: [{ departmentId: profile.department.id }, { departmentId: null }] },
    }),
  ])

  return {
    profile,
    projects: projects.map(({ milestones, _count, ...project }) => ({ ...project, nextMilestone: milestones[0] ?? null, counts: _count })),
    submissions,
    meetings,
    unreadNotifications,
  }
}
