import type { ProjectStatus } from "@/generated/prisma/client"

const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  IDEA: 8,
  DRAFT_PROPOSAL: 18,
  PROPOSAL_SUBMITTED: 28,
  APPROVED: 35,
  IN_PROGRESS: 62,
  REVISION_REQUIRED: 70,
  COMPLETED: 92,
  DEFENDED: 100,
  ARCHIVED: 100,
}

type ChapterProgress = { status: string }

export function calculateProjectProgress(status: ProjectStatus, chapters: ChapterProgress[]): number {
  const statusProgress = STATUS_PROGRESS[status]
  if (status === "DEFENDED" || status === "ARCHIVED" || chapters.length === 0) return statusProgress

  const approvedChapters = chapters.filter((chapter) => chapter.status === "APPROVED" || chapter.status === "PUBLISHED").length
  const writingProgress = approvedChapters / chapters.length
  return Math.min(95, statusProgress + Math.round(writingProgress * 30))
}
