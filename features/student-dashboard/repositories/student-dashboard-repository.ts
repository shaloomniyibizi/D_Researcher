import prisma from "@/lib/prisma"
import { calculateProjectProgress } from "@/features/projects/project-progress"

import type { StudentDashboardData, StudentShellProfile } from "../types"

const profileSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  studentNumber: true,
  onboardingCompletedAt: true,
  department: {
    select: {
      id: true,
      name: true,
      code: true,
      institution: { select: { name: true } },
    },
  },
} as const

export async function getStudentShellProfile(
  userId: string,
): Promise<StudentShellProfile | null> {
  return prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", status: "ACTIVE" },
    select: profileSelect,
  })
}

export async function getStudentDashboardData(
  userId: string,
): Promise<StudentDashboardData | null> {
  const profile = await getStudentShellProfile(userId)
  const departmentId = profile?.department?.id

  if (!profile || !departmentId) return null

  const [projects, tasks, meetings, notifications] = await Promise.all([
    prisma.project.findMany({
      where: {
        departmentId,
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, joinedAt: { not: null } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        supervisor: { select: { name: true, image: true } },
        documents: { where: { title: { startsWith: "[Chapter] " } }, take: 50, select: { status: true } },
        milestones: {
          where: { status: { not: "APPROVED" } },
          orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { id: true, title: true, status: true, dueAt: true },
        },
        _count: { select: { tasks: true, documents: true, sources: true } },
      },
    }),
    prisma.researchTask.findMany({
      where: {
        project: { departmentId, deletedAt: null },
        assignees: { some: { userId } },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueAt: true,
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.meeting.findMany({
      where: {
        project: { departmentId, deletedAt: null },
        attendees: { some: { userId } },
        status: "SCHEDULED",
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      take: 4,
      select: {
        id: true,
        title: true,
        startsAt: true,
        meetingUrl: true,
        project: { select: { title: true } },
      },
    }),
    prisma.notification.findMany({
      where: {
        userId,
        status: "UNREAD",
        OR: [{ departmentId }, { departmentId: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        body: true,
        actionUrl: true,
        createdAt: true,
      },
    }),
  ])

  return {
    profile,
    projects: projects.map(({ _count, documents, ...project }) => ({
      ...project,
      progress: calculateProjectProgress(project.status, documents),
      counts: _count,
    })),
    tasks,
    meetings,
    notifications,
  }
}
