export type ProjectChatRoom = {
  id: string
  title: string
  counterpartName: string | null
  counterpartImage: string | null
  lastMessage: string | null
  lastMessageAt: Date | null
}

export type ProjectChatMessageItem = {
  id: string
  body: string
  createdAt: Date
  author: { id: string; name: string; image: string | null; role: "STUDENT" | "SUPERVISOR" | "ADMIN" }
}

export type ProjectChatData = {
  room: { id: string; title: string }
  messages: ProjectChatMessageItem[]
}

export type SendProjectChatMessageResult =
  | { success: true; data: ProjectChatMessageItem }
  | { success: false; error: string }
