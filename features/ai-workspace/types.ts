export type AiWorkspaceProject = { id: string; title: string }

export type AiWorkspaceConversation = {
  id: string
  title: string
  project: { id: string; title: string } | null
  updatedAt: Date
}

export type AiWorkspaceMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export type AiWorkspaceData = {
  projects: AiWorkspaceProject[]
  conversations: AiWorkspaceConversation[]
  activeConversation: AiWorkspaceConversation | null
  messages: AiWorkspaceMessage[]
}

export type SendAiMessageResult =
  | { success: true; data: { conversationId: string; message: AiWorkspaceMessage } }
  | { success: false; error: string }
