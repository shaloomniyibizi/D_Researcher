import { extractText, getDocumentProxy } from "unpdf"

export const MIN_EXTRACTED_CHARS = 50
export const MAX_DOCUMENT_TOKENS = 200_000

const CHUNK_SIZE_TOKENS = 512
const CHUNK_OVERLAP_TOKENS = 50
const AVG_CHARS_PER_TOKEN = 4

export type ExtractedPdf = {
  text: string
  pageCount: number
}

export async function extractPdfText(fileBuffer: ArrayBuffer): Promise<ExtractedPdf> {
  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer))
  const { text, totalPages } = await extractText(pdf, { mergePages: true })

  return { text: text.trim(), pageCount: totalPages }
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
}

export type TextChunk = {
  chunkIndex: number
  content: string
  tokenCount: number
}

export function chunkText(text: string): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return []
  }

  const wordsPerChunk = Math.max(1, Math.floor((CHUNK_SIZE_TOKENS * AVG_CHARS_PER_TOKEN) / 6))
  const wordOverlap = Math.max(0, Math.floor((CHUNK_OVERLAP_TOKENS * AVG_CHARS_PER_TOKEN) / 6))
  const step = Math.max(1, wordsPerChunk - wordOverlap)

  const chunks: TextChunk[] = []
  let chunkIndex = 0

  for (let start = 0; start < words.length; start += step) {
    const content = words.slice(start, start + wordsPerChunk).join(" ")
    chunks.push({ chunkIndex, content, tokenCount: estimateTokenCount(content) })
    chunkIndex += 1

    if (start + wordsPerChunk >= words.length) {
      break
    }
  }

  return chunks
}
