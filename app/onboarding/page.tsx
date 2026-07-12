import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { getOnboardingPageData } from "@/features/onboarding/repositories/onboarding-repository"
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form"

function getRoleHome(role: "STUDENT" | "SUPERVISOR" | "ADMIN"): string {
  if (role === "ADMIN") return "/admin"
  if (role === "SUPERVISOR") return "/supervisor"
  return "/student"
}

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth?mode=sign-in")
  }

  const pageData = await getOnboardingPageData(session.user.id)

  if (!pageData) {
    redirect("/auth?mode=sign-in")
  }

  if (pageData.user.onboardingCompletedAt) {
    redirect(getRoleHome(pageData.user.role))
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-3xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete your research profile</CardTitle>
            <CardDescription>
              Add the academic details needed to route your workspace, supervision, and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pageData.departments.length > 0 ? (
              <OnboardingForm
                user={pageData.user}
                departments={pageData.departments}
              />
            ) : (
              <Alert variant="destructive">
                <AlertTitle>No departments configured</AlertTitle>
                <AlertDescription>
                  Ask an administrator to seed or create departments before onboarding users..
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
