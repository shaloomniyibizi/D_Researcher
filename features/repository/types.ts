import type { RepositoryRecordType } from "@/generated/prisma/client"

export type RepositoryFilters = {
  query?: string
  type?: RepositoryRecordType
  departmentId?: string
  year?: number
  page: number
}

export type RepositoryRecordSummary = {
  id: string
  type: RepositoryRecordType
  title: string
  abstract: string | null
  authors: string[]
  year: number | null
  technologies: string[]
  supervisorName: string | null
  fileUrl: string | null
  externalUrl: string | null
  publishedAt: Date | null
  department: { id: string; name: string; code: string } | null
}

export type StudentRepositoryData = {
  records: RepositoryRecordSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  institution: { id: string; name: string }
  departments: Array<{ id: string; name: string; code: string }>
  years: number[]
  countsByType: Partial<Record<RepositoryRecordType, number>>
}

export type PublishableProject = { id: string; title: string; status: string; alreadyPublished: boolean }
export type PublishPastProjectResult = { success: true; data: { recordId: string } } | { success: false; error: string }
export type RepositoryChatSource = { recordId: string; title: string; type: string; href: string }
export type RepositoryChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: Date; sources?: RepositoryChatSource[] }
export type RepositoryChatResult = { success: true; data: { conversationId: string; message: RepositoryChatMessage } } | { success: false; error: string }
