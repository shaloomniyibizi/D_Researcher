import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { StudentShell } from "@/features/student-dashboard/components/student-shell"
import { getStudentShellProfile } from "@/features/student-dashboard/repositories/student-dashboard-repository"
import { auth } from "@/lib/auth"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") redirect("/onboarding")

  const profile = await getStudentShellProfile(session.user.id)

  if (!profile) redirect("/auth?mode=sign-in")
  if (!profile.onboardingCompletedAt || !profile.department) redirect("/onboarding")

  return (
    <StudentShell profile={profile}>{children}</StudentShell>
  )
}
