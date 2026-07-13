import type {
  MilestoneStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/generated/prisma/client"

export type StudentShellProfile = {
  id: string
  name: string
  email: string
  image: string | null
  studentNumber: string | null
  onboardingCompletedAt: Date | null
  department: {
    id: string
    name: string
    code: string
    institution: { name: string }
  } | null
}

export type StudentDashboardData = {
  profile: StudentShellProfile
  projects: Array<{
    id: string
    title: string
    status: ProjectStatus
    progress: number
    updatedAt: Date
    supervisor: { name: string; image: string | null } | null
    milestones: Array<{
      id: string
      title: string
      status: MilestoneStatus
      dueAt: Date | null
    }>
    counts: { tasks: number; documents: number; sources: number }
  }>
  tasks: Array<{
    id: string
    title: string
    status: TaskStatus
    priority: TaskPriority
    dueAt: Date | null
    project: { id: string; title: string }
  }>
  meetings: Array<{
    id: string
    title: string
    startsAt: Date
    meetingUrl: string | null
    project: { title: string }
  }>
  notifications: Array<{
    id: string
    title: string
    body: string
    actionUrl: string | null
    createdAt: Date
  }>
}
