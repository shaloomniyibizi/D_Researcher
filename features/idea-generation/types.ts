export type ResearchIdea = { title: string; problemStatement: string; proposedApproach: string; objectives: string[]; keywords: string[]; feasibility: "LOW" | "MEDIUM" | "HIGH"; expectedContribution: string }
export type IdeaGeneration = { id: string; createdAt: Date; ideas: ResearchIdea[] }
export type GenerateIdeasResult = { success: true; data: IdeaGeneration } | { success: false; error: string }
export type IdeaDecisionResult = { success: true } | { success: false; error: string }
