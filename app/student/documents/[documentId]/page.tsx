import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { DocumentChat } from "@/features/knowledge-base/components/document-chat"
import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { getDocumentChatData } from "@/features/knowledge-base/repositories/document-chat-repository"
import { listStudentDocuments } from "@/features/knowledge-base/repositories/knowledge-document-repository"
import { getServerSession } from "@/lib/server-session"
import { isEmbeddingConfigured } from "@/lib/embeddings"
import { isGeminiConfigured } from "@/lib/gemini"
import { isPineconeConfigured } from "@/lib/pinecone"

export const metadata: Metadata = {
  title: "Chat with document | Researcher",
  description: "Ask questions grounded in an uploaded PDF's content.",
}

export default async function StudentDocumentChatPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  let session

  try {
    session = await getServerSession(await headers())
  } catch (error) {
    console.error("Could not connect to the database while loading document chat.", error)
    return <DatabaseUnavailable />
  }
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  const { documentId } = await params
  let data
  let documents

  try {
    ;[data, documents] = await Promise.all([
      getDocumentChatData(session.user.id, documentId),
      listStudentDocuments(session.user.id),
    ])
  } catch (error) {
    console.error("Could not connect to the database while loading the document conversation.", error)
    return <DatabaseUnavailable />
  }
  if (!data || !documents) notFound()
  if (data.document.status !== "INDEXED") redirect("/student/documents")

  return (
    <DocumentChat
      data={{ ...data, documents }}
      configured={isGeminiConfigured && isEmbeddingConfigured && isPineconeConfigured}
    />
  )
}
