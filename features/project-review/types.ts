export type ProjectChange = { field: string; before: unknown; after: unknown }

export type SupervisorProjectReview = {
  project: {
    id: string; title: string; abstract: string | null; problemStatement: string | null
    objectives: string[]; keywords: string[]; status: string
    owner: { name: string; image: string | null; studentNumber: string | null }
  }
  activity: Array<{
    id: string; action: string; createdAt: Date
    actor: { name: string; image: string | null } | null
    changes: ProjectChange[]
    feedback: Array<{ id: string; body: string; createdAt: Date; author: { name: string; image: string | null } }>
  }>
}

export type AddChangeFeedbackResult = { success: true } | { success: false; error: string }
