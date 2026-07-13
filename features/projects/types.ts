import type { MilestoneStatus, ProjectStatus, ProjectVisibility, TaskPriority, TaskStatus } from "@/generated/prisma/client"

export type SupervisorOption = {
  id: string
  name: string
  email: string
  image: string | null
}

export type CreateProjectInput = {
  title: string
  abstract: string | null
  problemStatement: string | null
  objectives: string[]
  keywords: string[]
  visibility: ProjectVisibility
  supervisorId: string | null
}

export type CreateProjectActionResult =
  | { success: true; data: { projectId: string } }
  | { success: false; error: string }

export type EditableStudentProject = {
  id: string
  title: string
  abstract: string | null
  problemStatement: string | null
  objectives: string[]
  keywords: string[]
  visibility: ProjectVisibility
  supervisorId: string | null
}

export type StudentProjectSummary = {
  id: string
  title: string
  abstract: string | null
  status: ProjectStatus
  progress: number
  visibility: ProjectVisibility
  keywords: string[]
  updatedAt: Date
  supervisor: { name: string; image: string | null } | null
  nextMilestone: { id: string; title: string; status: MilestoneStatus; dueAt: Date | null } | null
  counts: { tasks: number; documents: number; sources: number; members: number }
}

export type StudentProjectDetails = {
  id: string
  title: string
  abstract: string | null
  problemStatement: string | null
  objectives: string[]
  keywords: string[]
  status: ProjectStatus
  visibility: ProjectVisibility
  startedAt: Date | null
  updatedAt: Date
  department: { name: string; code: string; institution: { name: string } }
  owner: { id: string; name: string; image: string | null }
  supervisor: { id: string; name: string; email: string; image: string | null } | null
  members: Array<{ id: string; role: string; user: { id: string; name: string; image: string | null } }>
  milestones: Array<{ id: string; title: string; description: string | null; status: MilestoneStatus; dueAt: Date | null }>
  tasks: Array<{ id: string; title: string; status: TaskStatus; priority: TaskPriority; dueAt: Date | null }>
  counts: { documents: number; sources: number; submissions: number; feedback: number }
}
