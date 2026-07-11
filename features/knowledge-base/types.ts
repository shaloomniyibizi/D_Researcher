export type KnowledgeDocumentStatusValue = "PENDING" | "PROCESSING" | "INDEXED" | "FAILED" | "EMPTY"

export type KnowledgeDocumentSummary = {
  id: string
  title: string
  status: KnowledgeDocumentStatusValue
  errorMessage: string | null
  tokenCount: number
  createdAt: Date
  indexedAt: Date | null
}

export type KnowledgeDocumentDetail = KnowledgeDocumentSummary & {
  uploadedFile: { name: string; url: string; sizeBytes: number } | null
}

export type DocumentChatCitation = {
  chunkId: string
  chunkIndex: number
  snippet: string
}

export type DocumentChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations: DocumentChatCitation[] | null
  createdAt: Date
}

export type DocumentChatData = {
  document: KnowledgeDocumentDetail
  documents: KnowledgeDocumentSummary[]
  conversationId: string | null
  messages: DocumentChatMessage[]
}

export type IngestDocumentResult =
  | { success: true; documentId: string }
  | { success: false; error: string }

export type DeleteDocumentResult =
  | { success: true }
  | { success: false; error: string }

export type SendDocumentMessageResult =
  | { success: true; data: { conversationId: string; message: DocumentChatMessage } }
  | { success: false; error: string }
