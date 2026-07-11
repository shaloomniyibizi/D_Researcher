import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { SupervisorShell } from "@/features/supervisor-dashboard/components/supervisor-shell"
import { getSupervisorProfile } from "@/features/supervisor-dashboard/repositories/supervisor-dashboard-repository"
import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  let session
  try { session = await getServerSession(await headers()) } catch (error) { console.error("Could not load supervisor session.", error); return <DatabaseUnavailable /> }
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.SUPERVISOR) redirect("/onboarding")

  let profile
  try { profile = await getSupervisorProfile(session.user.id) } catch (error) { console.error("Could not load supervisor profile.", error); return <DatabaseUnavailable /> }
  if (!profile?.department) redirect("/onboarding")
  return <SupervisorShell profile={profile}>{children}</SupervisorShell>
}
