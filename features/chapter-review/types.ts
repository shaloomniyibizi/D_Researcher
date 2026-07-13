import type { DocumentStatus } from "@/generated/prisma/client"

export type ChapterReviewComment = {
  id: string
  body: string
  selectionText: string | null
  resolvedAt: Date | null
  createdAt: Date
  author: { name: string }
}

export type SupervisorChapterReview = {
  id: string
  title: string
  content: string
  status: DocumentStatus
  wordCount: number
  updatedAt: Date
  comments: ChapterReviewComment[]
}

export type ChapterReviewResult = { success: true } | { success: false; error: string }
