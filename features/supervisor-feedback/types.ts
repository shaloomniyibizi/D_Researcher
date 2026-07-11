export type FeedbackStatusFilter = "all" | "open" | "resolved"
export type SupervisorFeedbackPageData = {
  items: Array<{ id: string; body: string; createdAt: Date; resolvedAt: Date | null; activityLogId: string | null; project: { id: string; title: string; owner: { name: string; image: string | null; studentNumber: string | null } }; submission: { id: string; title: string } | null; document: { id: string; title: string } | null }>
  totals: { all: number; open: number; resolved: number }
  page: number
  pageCount: number
}
