import { UserRole } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"

import type { ProjectChatData, ProjectChatRoom } from "../types"

const ROOM_PAGE_SIZE = 50
const MESSAGE_PAGE_SIZE = 100

function accessWhere(userId: string, role: UserRole) {
  if (role === UserRole.SUPERVISOR) return { supervisorId: userId }
  return {
    OR: [
      { ownerId: userId },
      { members: { some: { userId, joinedAt: { not: null } } } },
    ],
  }
}

export async function getProjectChatRooms(
  userId: string,
  role: UserRole,
): Promise<ProjectChatRoom[]> {
  const projects = await prisma.project.findMany({
    where: { ...accessWhere(userId, role), deletedAt: null, supervisorId: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: ROOM_PAGE_SIZE,
    select: {
      id: true,
      title: true,
      owner: { select: { name: true, image: true } },
      supervisor: { select: { name: true, image: true } },
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true },
      },
    },
  })

  return projects.map((project) => {
    const counterpart = role === UserRole.SUPERVISOR ? project.owner : project.supervisor
    const latest = project.chatMessages[0]
    return {
      id: project.id,
      title: project.title,
      counterpartName: counterpart?.name ?? null,
      counterpartImage: counterpart?.image ?? null,
      lastMessage: latest?.body ?? null,
      lastMessageAt: latest?.createdAt ?? null,
    }
  })
}

export async function getProjectChatData(
  userId: string,
  role: UserRole,
  projectId: string,
): Promise<ProjectChatData | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...accessWhere(userId, role), deletedAt: null, supervisorId: { not: null } },
    select: {
      id: true,
      title: true,
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: MESSAGE_PAGE_SIZE,
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      },
    },
  })

  if (!project) return null
  return {
    room: { id: project.id, title: project.title },
    messages: project.chatMessages.reverse(),
  }
}

export async function createProjectChatMessage(input: {
  userId: string
  role: UserRole
  projectId: string
  body: string
}) {
  return prisma.$transaction(async (db) => {
    const project = await db.project.findFirst({
      where: { id: input.projectId, ...accessWhere(input.userId, input.role), deletedAt: null, supervisorId: { not: null } },
      select: { id: true },
    })
    if (!project) return null

    return db.projectChatMessage.create({
      data: { projectId: project.id, authorId: input.userId, body: input.body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    })
  })
}
