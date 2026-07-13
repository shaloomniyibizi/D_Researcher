import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { APICallError, generateText, Output, RetryError, type ModelMessage } from "ai"
import { z } from "zod"

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({ apiKey })

export const isGeminiConfigured = Boolean(apiKey)

export class GeminiTemporarilyUnavailableError extends Error {
  constructor() {
    super("Gemini is temporarily unavailable")
    this.name = "GeminiTemporarilyUnavailableError"
  }
}

export const researchIdeasSchema = z.object({
  ideas: z.array(z.object({
    title: z.string(),
    problemStatement: z.string(),
    proposedApproach: z.string(),
    objectives: z.array(z.string()),
    keywords: z.array(z.string()),
    feasibility: z.enum(["LOW", "MEDIUM", "HIGH"]),
    expectedContribution: z.string(),
  })),
})

const generatedResearchIdeasSchema = z.object({
  ideas: z.array(z.object({
    title: z.string(),
    problemStatement: z.string(),
    proposedApproach: z.string(),
    objectives: z.array(z.string()),
    keywords: z.array(z.string()),
    feasibility: z.string(),
    expectedContribution: z.string(),
  })),
})

function normalizeFeasibility(value: string): "LOW" | "MEDIUM" | "HIGH" {
  const normalized = value.trim().toUpperCase()
  return normalized === "LOW" || normalized === "HIGH" ? normalized : "MEDIUM"
}

function getApiCallError(error: unknown): APICallError | null {
  if (APICallError.isInstance(error)) return error
  if (RetryError.isInstance(error) && APICallError.isInstance(error.lastError)) {
    return error.lastError
  }
  return null
}

function canFailOver(error: APICallError): boolean {
  return error.isRetryable || error.statusCode === 404
}

export async function generateResearchIdeas(
  input: {
    discipline: string;
    interests: string;
    problemArea: string;
    technologies: string;
    constraints: string
  }) {

  if (!isGeminiConfigured) throw new Error("Gemini is not configured")
  const primaryModel = process.env.GEMINI_MODEL ?? "gemini-3.5-flash"
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.1-flash-lite"
  const generateWithModel = (model: string, maxRetries: number) => generateText({
      model: google(model),
      output: Output.object({ schema: generatedResearchIdeasSchema }),
      system: "You are an academic research ideation expert. Propose original, ethical, feasible final-year university projects. Avoid invented evidence and overly broad topics. Each idea must define a specific problem, practical approach, measurable objectives, feasibility, and contribution.",
      prompt: `Discipline: ${input.discipline}\nResearch interests: ${input.interests}\nProblem area: ${input.problemArea || "Open"}\nPreferred technologies or methods: ${input.technologies || "Open"}\nConstraints: ${input.constraints || "Typical final-year budget and timeline"}\nGenerate 4 distinct ideas tailored to this context.`,
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4_000,
      maxRetries,
      timeout: { totalMs: 75_000 },
    })

  let result: Awaited<ReturnType<typeof generateWithModel>>
  try {
    result = await generateWithModel(primaryModel, 2)
  } catch (error) {
    const apiError = getApiCallError(error)
    if (!apiError || !canFailOver(apiError)) throw error

    if (fallbackModel === primaryModel) {
      throw new GeminiTemporarilyUnavailableError()
    }

    try {
      result = await generateWithModel(fallbackModel, 1)
    } catch (fallbackError) {
      const fallbackApiError = getApiCallError(fallbackError)
      if (fallbackApiError?.isRetryable) {
        throw new GeminiTemporarilyUnavailableError()
      }
      throw fallbackError
    }
  }
  const ideas = result.output.ideas.slice(0, 5).map((idea) => ({
    title: idea.title.trim().slice(0, 180),
    problemStatement: idea.problemStatement.trim().slice(0, 1_000),
    proposedApproach: idea.proposedApproach.trim().slice(0, 800),
    objectives: idea.objectives.map((value) => value.trim().slice(0, 240)).filter(Boolean).slice(0, 5),
    keywords: idea.keywords.map((value) => value.trim().slice(0, 60)).filter(Boolean).slice(0, 8),
    feasibility: normalizeFeasibility(idea.feasibility),
    expectedContribution: idea.expectedContribution.trim().slice(0, 500),
  })).filter((idea) => idea.title && idea.problemStatement && idea.proposedApproach)

  if (ideas.length < 3) throw new Error("Gemini returned too few usable research ideas")
  return ideas
}

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
    model: google(process.env.GEMINI_MODEL ?? "gemini-3.5-flash"),
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

export async function generateRepositoryProjectResponse(input: { messages: Array<{ role: "user" | "assistant"; content: string }>; projectContext: string }): Promise<string> {
  if (!isGeminiConfigured) throw new Error("Gemini is not configured")
  const result = await generateText({ model: google(process.env.GEMINI_MODEL ?? "gemini-3.5-flash"), system: ["You are an institutional research repository assistant covering past projects, research papers, and capstone reports.", "Use only the numbered repository records below. Never invent findings, methods, citations, or implementation details.", "Identify the record title when answering and distinguish records when comparing them.", "If the answer is absent, clearly say the repository material provided does not contain it.", `Repository material:\n${input.projectContext}`].join("\n\n"), messages: input.messages, temperature: 0.2, topP: 0.9, maxOutputTokens: 900, maxRetries: 2, timeout: { totalMs: 45_000 } })
  return result.text.trim()
}
