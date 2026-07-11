"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { getServerSession } from "@/lib/server-session"
import { markAllUserNotificationsRead, markUserNotificationRead } from "./repositories/notification-repository"
import type { NotificationActionResult } from "./types"

const schema = z.object({ notificationId: z.string().trim().min(1).max(100) })
function paths(role: string) { return role === "SUPERVISOR" ? "/supervisor/notifications" : "/student/notifications" }
export async function markNotificationRead(input: unknown): Promise<NotificationActionResult> {
  const session = await getServerSession(await headers()); if (!session) return { success: false, error: "Unauthorized" }
  const parsed = schema.safeParse(input); if (!parsed.success) return { success: false, error: "Invalid notification." }
  try { await markUserNotificationRead(session.user.id, parsed.data.notificationId); revalidatePath(paths(session.user.role ?? "")); return { success: true } } catch (error) { console.error(error); return { success: false, error: "Could not update notification." } }
}
export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const session = await getServerSession(await headers()); if (!session) return { success: false, error: "Unauthorized" }
  try { await markAllUserNotificationsRead(session.user.id); revalidatePath(paths(session.user.role ?? "")); return { success: true } } catch (error) { console.error(error); return { success: false, error: "Could not update notifications." } }
}
