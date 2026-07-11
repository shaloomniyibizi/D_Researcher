import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { NotificationCenter } from "@/features/notifications/components/notification-center"
import { getUserNotifications } from "@/features/notifications/repositories/notification-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"
export default async function SupervisorNotificationsPage() { const session = await getServerSession(await headers()); if (!session) redirect("/auth?mode=sign-in"); if (session.user.role !== UserRole.SUPERVISOR) notFound(); return <NotificationCenter notifications={await getUserNotifications(session.user.id)} /> }
