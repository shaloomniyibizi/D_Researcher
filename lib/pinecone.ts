import { Pinecone } from "@pinecone-database/pinecone"
import { EMBEDDING_DIMENSION } from "@/lib/embeddings"

const apiKey = process.env.PINECONE_API_KEY
const pinecone = apiKey ? new Pinecone({ apiKey }) : null

export const isPineconeConfigured = Boolean(apiKey)

const environment = process.env.PINECONE_ENVIRONMENT ?? process.env.NODE_ENV ?? "development"
const indexName = `research-${environment}`

export type KnowledgeVectorMetadata = {
  userId: string
  documentId: string
  chunkIndex: number
  role: string
}

export type KnowledgeVectorRecord = {
  id: string
  values: number[]
  metadata: KnowledgeVectorMetadata
}

function requirePinecone(): Pinecone {
  if (!pinecone) {
    throw new Error("Pinecone is not configured")
  }
  return pinecone
}

function isPineconeNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.name === "PineconeNotFoundError"
}

async function ensureIndexExists(client: Pinecone): Promise<void> {
  try {
    await client.describeIndex(indexName)
  } catch (error) {
    if (!isPineconeNotFoundError(error)) {
      throw error
    }

    await client.createIndex({
      name: indexName,
      dimension: EMBEDDING_DIMENSION,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: process.env.PINECONE_CLOUD ?? "aws",
          region: process.env.PINECONE_REGION ?? "us-east-1",
        },
      },
      suppressConflicts: true,
      waitUntilReady: true,
    })
  }
}

export async function upsertKnowledgeVectors(records: KnowledgeVectorRecord[]): Promise<void> {
  const client = requirePinecone()
  await ensureIndexExists(client)
  await client.index<KnowledgeVectorMetadata>({ name: indexName }).upsert({ records })
}

export async function queryKnowledgeVectors(input: {
  vector: number[]
  userId: string
  documentId: string
  topK?: number
}): Promise<Array<{ id: string; score: number | undefined; metadata: KnowledgeVectorMetadata | undefined }>> {
  const client = requirePinecone()
  const result = await client.index<KnowledgeVectorMetadata>({ name: indexName }).query({
    vector: input.vector,
    topK: input.topK ?? 5,
    includeMetadata: true,
    filter: { userId: { $eq: input.userId }, documentId: { $eq: input.documentId } },
  })

  return result.matches.map((match) => ({ id: match.id, score: match.score, metadata: match.metadata }))
}

export async function deleteKnowledgeVectorsForDocument(documentId: string): Promise<void> {
  if (!pinecone) {
    return
  }
  try {
    await pinecone.index({ name: indexName }).deleteMany({
      filter: { documentId: { $eq: documentId } },
    })
  } catch (error) {
    // Deletion is idempotent. If the index has not been created yet, there are
    // no vectors to remove and cleanup is already complete.
    if (isPineconeNotFoundError(error)) {
      return
    }

    throw error
  }
}
