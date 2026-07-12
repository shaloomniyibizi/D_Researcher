import prisma from "@/lib/prisma"
import type { RepositoryChatMessage, RepositoryChatSource } from "../types"

function parseSources(value: unknown): RepositoryChatSource[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => item && typeof item === "object" && "recordId" in item && "title" in item && "type" in item && "href" in item && typeof item.recordId === "string" && typeof item.title === "string" && typeof item.type === "string" && typeof item.href === "string" ? [{ recordId: item.recordId, title: item.title, type: item.type, href: item.href }] : [])
}

export async function getRepositoryChatHistory(userId: string) {
  const conversation = await prisma.aiConversation.findFirst({ where: { userId, projectId: null, knowledgeDocumentId: null, title: { startsWith: "Repository assistant" } }, orderBy: { updatedAt: "desc" }, select: { id: true, messages: { where: { role: { in: ["user", "assistant"] } }, orderBy: { createdAt: "asc" }, take: 100, select: { id: true, role: true, content: true, createdAt: true, citations: true } } } })
  if (!conversation) return { conversationId: null, messages: [] }
  return { conversationId: conversation.id, messages: conversation.messages.flatMap((message): RepositoryChatMessage[] => message.role === "user" || message.role === "assistant" ? [{ id: message.id, role: message.role, content: message.content, createdAt: message.createdAt, sources: parseSources(message.citations) }] : []) }
}

export async function prepareRepositoryChatTurn(input: { userId: string; conversationId: string | null; prompt: string }) {
  return prisma.$transaction(async (db) => {
    const student = await db.user.findFirst({ where: { id: input.userId, role: "STUDENT", status: "ACTIVE", department: { isNot: null } }, select: { department: { select: { institutionId: true } } } })
    if (!student?.department) return null
    const terms = input.prompt.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).slice(0, 8)
    const records = await db.repositoryRecord.findMany({ where: { institutionId: student.department.institutionId, type: { in: ["PAST_PROJECT", "RESEARCH_PAPER", "CAPSTONE_REPORT"] }, ...(terms.length ? { OR: terms.flatMap((term) => [{ title: { contains: term, mode: "insensitive" as const } }, { abstract: { contains: term, mode: "insensitive" as const } }, { technologies: { has: term } }]) } : {}) }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], take: 6, select: { id: true, type: true, title: true, abstract: true, authors: true, technologies: true, supervisorName: true, year: true, fileUrl: true, externalUrl: true, project: { select: { documents: { where: { title: { startsWith: "[Chapter] " } }, orderBy: { createdAt: "asc" }, take: 15, select: { title: true, content: true } } } } } })
    const fallbackRecords = records.length ? records : await db.repositoryRecord.findMany({ where: { institutionId: student.department.institutionId, type: { in: ["PAST_PROJECT", "RESEARCH_PAPER", "CAPSTONE_REPORT"] } }, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], take: 6, select: { id: true, type: true, title: true, abstract: true, authors: true, technologies: true, supervisorName: true, year: true, fileUrl: true, externalUrl: true, project: { select: { documents: { where: { title: { startsWith: "[Chapter] " } }, orderBy: { createdAt: "asc" }, take: 15, select: { title: true, content: true } } } } } })
    if (!fallbackRecords.length) return null
    const recent = await db.aiMessage.count({ where: { authorId: input.userId, role: "user", createdAt: { gte: new Date(Date.now() - 60_000) } } })
    if (recent >= 8) return { rateLimited: true as const }
    let conversation = input.conversationId ? await db.aiConversation.findFirst({ where: { id: input.conversationId, userId: input.userId, projectId: null, knowledgeDocumentId: null, title: { startsWith: "Repository assistant" } }, select: { id: true } }) : null
    if (input.conversationId && !conversation) return null
    conversation ??= await db.aiConversation.create({ data: { userId: input.userId, title: `Repository assistant: ${input.prompt}`.slice(0, 100) }, select: { id: true } })
    await db.aiMessage.create({ data: { conversationId: conversation.id, authorId: input.userId, role: "user", content: input.prompt } })
    const history = await db.aiMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: 12, select: { role: true, content: true } })
    const context = fallbackRecords.map((record, index) => [`[Record ${index + 1}]`, `Type: ${record.type}`, `Title: ${record.title}`, record.abstract ? `Abstract: ${record.abstract.replace(/<[^>]*>/g, " ")}` : null, `Authors: ${record.authors.join(", ")}`, record.supervisorName ? `Supervisor: ${record.supervisorName}` : null, record.year ? `Year: ${record.year}` : null, record.technologies.length ? `Technologies: ${record.technologies.join(", ")}` : null, ...(record.project?.documents ?? []).map((chapter) => `${chapter.title.slice(10)}:\n${(chapter.content ?? "").slice(0, 12_000)}`)].filter(Boolean).join("\n")).join("\n\n---\n\n").slice(0, 100_000)
    const sources: RepositoryChatSource[] = fallbackRecords.map((record) => ({ recordId: record.id, title: record.title, type: record.type, href: record.fileUrl ?? record.externalUrl ?? `/student/repository?query=${encodeURIComponent(record.title)}` }))
    return { rateLimited: false as const, conversationId: conversation.id, context, sources, history: history.reverse().flatMap((message): Array<{ role: "user" | "assistant"; content: string }> => message.role === "user" || message.role === "assistant" ? [{ role: message.role, content: message.content }] : []) }
  })
}

export async function saveRepositoryChatAnswer(conversationId: string, content: string, sources: RepositoryChatSource[]) { return prisma.aiMessage.create({ data: { conversationId, role: "assistant", content, citations: sources }, select: { id: true, role: true, content: true, createdAt: true } }) }
