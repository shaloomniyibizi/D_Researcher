import {
  createGoogleGenerativeAI,
  type GoogleEmbeddingModelOptions,
} from "@ai-sdk/google"
import { embed, embedMany } from "ai"

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({ apiKey })
const model = google.embedding(process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001")

export const EMBEDDING_DIMENSION = 768

export const isEmbeddingConfigured = Boolean(apiKey)

export async function embedText(value: string): Promise<number[]> {
  if (!isEmbeddingConfigured) {
    throw new Error("Embeddings are not configured")
  }

  const { embedding } = await embed({
    model,
    value,
    maxRetries: 2,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSION,
        taskType: "RETRIEVAL_QUERY",
      } satisfies GoogleEmbeddingModelOptions,
    },
  })
  return embedding
}

export async function embedTexts(values: string[]): Promise<number[][]> {
  if (!isEmbeddingConfigured) {
    throw new Error("Embeddings are not configured")
  }

  const { embeddings } = await embedMany({
    model,
    values,
    maxRetries: 2,
    maxParallelCalls: 4,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSION,
        taskType: "RETRIEVAL_DOCUMENT",
      } satisfies GoogleEmbeddingModelOptions,
    },
  })
  return embeddings
}
