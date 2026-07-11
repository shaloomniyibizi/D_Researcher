import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { DocumentList } from "@/features/knowledge-base/components/document-list"
import { DocumentUpload } from "@/features/knowledge-base/components/document-upload"
import { DatabaseUnavailable } from "@/components/shared/database-unavailable"
import { listStudentDocuments } from "@/features/knowledge-base/repositories/knowledge-document-repository"
import { getServerSession } from "@/lib/server-session"
import { isEmbeddingConfigured } from "@/lib/embeddings"
import { isPineconeConfigured } from "@/lib/pinecone"

export const metadata: Metadata = {
  title: "Documents | Researcher",
  description: "Upload a PDF and chat with its content.",
}

export default async function StudentDocumentsPage() {
  let session

  try {
    session = await getServerSession(await headers())
  } catch (error) {
    console.error("Could not connect to the database while loading document chat.", error)
    return <DatabaseUnavailable />
  }
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  let documents

  try {
    documents = await listStudentDocuments(session.user.id)
  } catch (error) {
    console.error("Could not connect to the database while loading documents.", error)
    return <DatabaseUnavailable />
  }
  if (!documents) redirect("/onboarding")

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="mb-1 text-xs font-medium text-primary">Knowledge base</p>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload PDFs and ask questions answered directly from their content.</p>
      </header>

      <DocumentUpload configured={isPineconeConfigured && isEmbeddingConfigured} />
      <DocumentList documents={documents} />
    </main>
  )
}
