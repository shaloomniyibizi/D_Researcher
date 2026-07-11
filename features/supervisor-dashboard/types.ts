import type { ProjectStatus, SubmissionStatus } from "@/generated/prisma/client"

export type SupervisorProfile = {
  id: string
  name: string
  email: string
  image: string | null
  staffNumber: string | null
  department: { id: string; name: string; code: string; institution: { name: string } } | null
}

export type SupervisorDashboardData = {
  profile: SupervisorProfile
  projects: Array<{
    id: string
    title: string
    status: ProjectStatus
    updatedAt: Date
    owner: { name: string; image: string | null; studentNumber: string | null }
    nextMilestone: { title: string; status: string; dueAt: Date | null } | null
    counts: { submissions: number; documents: number; tasks: number }
  }>
  submissions: Array<{
    id: string
    title: string
    status: SubmissionStatus
    submittedAt: Date
    project: { id: string; title: string }
    submittedBy: { name: string; image: string | null }
  }>
  meetings: Array<{
    id: string
    title: string
    startsAt: Date
    meetingUrl: string | null
    project: { id: string; title: string; owner: { name: string } }
  }>
  unreadNotifications: number
}
