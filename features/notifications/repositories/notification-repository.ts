import prisma from "@/lib/prisma"
import type { NotificationItem } from "../types"

export function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  return prisma.notification.findMany({ where: { userId, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, body: true, actionUrl: true, status: true, createdAt: true } })
}
export async function markUserNotificationRead(userId: string, notificationId: string): Promise<boolean> {
  const result = await prisma.notification.updateMany({ where: { id: notificationId, userId, status: "UNREAD" }, data: { status: "READ", readAt: new Date() } })
  return result.count > 0
}
export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, status: "UNREAD" }, data: { status: "READ", readAt: new Date() } })
}
