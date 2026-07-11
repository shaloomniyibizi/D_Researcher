export type ChapterFile = { id: string; name: string; url: string; mimeType: string; sizeBytes: number }
export type ProjectChapter = { id: string; title: string; content: string; sortOrder: number; wordCount: number; updatedAt: Date; files: ChapterFile[] }
export type ChapterResult = { success: true; data?: { chapterId: string } } | { success: false; error: string }
