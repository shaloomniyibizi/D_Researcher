import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, Output, type ModelMessage } from "ai"
import { z } from "zod"

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
const google = createGoogleGenerativeAI({ apiKey })

export const isGeminiConfigured = Boolean(apiKey)

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

export async function generateResearchIdeas(
  input: {
    discipline: string;
    interests: string;
    problemArea: string;
    technologies: string;
    constraints: string
  }) {

  if (!isGeminiConfigured) throw new Error("Gemini is not configured")
  const result = await generateText({
    model: google(process.env.GEMINI_MODEL ?? "gemini-2.5-pro"),
    output: Output.object({ schema: generatedResearchIdeasSchema }),
    system: "You are an academic research ideation expert. Propose original, ethical, feasible final-year university projects. Avoid invented evidence and overly broad topics. Each idea must define a specific problem, practical approach, measurable objectives, feasibility, and contribution.",
    prompt: `Discipline: ${input.discipline}\nResearch interests: ${input.interests}\nProblem area: ${input.problemArea || "Open"}\nPreferred technologies or methods: ${input.technologies || "Open"}\nConstraints: ${input.constraints || "Typical final-year budget and timeline"}\nGenerate 4 distinct ideas tailored to this context.`,
    temperature: 0.7, topP: 0.9, maxOutputTokens: 4_000, maxRetries: 2, timeout: { totalMs: 75_000 },
  })
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
