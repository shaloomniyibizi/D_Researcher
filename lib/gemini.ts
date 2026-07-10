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
    model: google(process.env.GEMINI_MODEL ?? "gemini-3.5-flash"),
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
