export type ChapterFile = { id: string; name: string; url: string; mimeType: string; sizeBytes: number }
export type ChapterComment = { id: string; body: string; selectionText: string | null; resolvedAt: Date | null; createdAt: Date; author: { name: string } }
export type ProjectChapter = { id: string; title: string; content: string; status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED"; sortOrder: number; wordCount: number; updatedAt: Date; files: ChapterFile[]; comments: ChapterComment[] }
export type ChapterResult = { success: true; data?: { chapterId: string } } | { success: false; error: string }
