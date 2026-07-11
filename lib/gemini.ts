import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, type ModelMessage } from "ai"

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({ apiKey })

export const isGeminiConfigured = Boolean(apiKey)

export async function generateResearchResponse(input: {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  projectContext: string | null
}): Promise<string> {
  if (!isGeminiConfigured) {
    throw new Error("Gemini is not configured")
  }

  const messages: ModelMessage[] = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  const result = await generateText({
    model: google(process.env.GEMINI_MODEL ?? "gemini-1.5-pro"),
    system: [
      "You are Researcher AI, an academic research assistant for final-year university students.",
      "Give rigorous, practical guidance. Clearly distinguish evidence, assumptions, and suggestions.",
      "Do not invent citations, sources, findings, or institutional rules.",
      "When context is incomplete, state what information is missing.",
      input.projectContext ? `Current project context:\n${input.projectContext}` : "No project is attached to this conversation.",
    ].join("\n\n"),
    messages,
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 1_200,
    maxRetries: 2,
    timeout: { totalMs: 45_000 },
  })

  return result.text.trim()
}

export async function generateDocumentChatResponse(input: {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  contextChunks: Array<{ index: number; content: string }>
}): Promise<string> {
  if (!isGeminiConfigured) {
    throw new Error("Gemini is not configured")
  }

  const messages: ModelMessage[] = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  const excerpts = input.contextChunks.map((chunk) => `[${chunk.index}] ${chunk.content}`).join("\n\n")

  const result = await generateText({
    model: google(process.env.GEMINI_MODEL ?? "gemini-1.5-pro"),
    system: [
      "You are Researcher AI, answering questions about a single uploaded PDF document for a final-year university student.",
      "Answer only using the numbered excerpts below. Do not use outside knowledge and do not invent facts.",
      "Cite the excerpts you rely on using their bracketed numbers, e.g. [1], [2], matching the numbering below.",
      "If the excerpts do not contain the answer, clearly say the document does not cover it rather than guessing.",
      excerpts ? `Document excerpts:\n${excerpts}` : "No relevant excerpts were retrieved for this question.",
    ].join("\n\n"),
    messages,
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 1_200,
    maxRetries: 2,
    timeout: { totalMs: 45_000 },
  })

  return result.text.trim()
}
