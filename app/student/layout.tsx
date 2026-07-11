import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { StudentShell } from "@/features/student-dashboard/components/student-shell"
import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { getStudentShellProfile } from "@/features/student-dashboard/repositories/student-dashboard-repository"
import { getServerSession } from "@/lib/server-session"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  let session

  try {
    session = await getServerSession(await headers())
  } catch (error) {
    console.error("Could not connect to the database while loading the student session.", error)
    return <DatabaseUnavailable />
  }

  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") redirect("/onboarding")

  let profile

  try {
    profile = await getStudentShellProfile(session.user.id)
  } catch (error) {
    console.error("Could not connect to the database while loading the student profile.", error)
    return <DatabaseUnavailable />
  }

  if (!profile) redirect("/auth?mode=sign-in")
  if (!profile.onboardingCompletedAt || !profile.department) redirect("/onboarding")

  return (
    <StudentShell profile={profile}>{children}</StudentShell>
  )
}
