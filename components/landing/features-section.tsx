import {
  BookOpen,
  Brain,
  ClipboardCheck,
  NotebookPen,
  Users,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "AI paper intelligence",
    description:
      "Students chat with one or many papers, compare methods, extract limitations, and receive cited answers with page references.",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    description:
      "Work alongside supervisors and peers with shared workspaces, comments, equest corrections, manage meetings, assess rubrics and live document updates.",
  },
  {
    icon: ClipboardCheck,
    title: "Structured evaluation",
    description:
      "Track milestones, submit work for review, and receive structured feedback aligned with academic standards.",
  },
  {
    icon: BookOpen,
    title: "Knowledge base",
    description:
      "Build a searchable repository of references, notes, and institutional resources for every project.",
  },
  {
    icon: NotebookPen ,
    title: "Proposal studio",
    description:
      "Generate titles, objectives, methodology options, expected outcomes, and structured drafts while keeping students in control of authorship.",
  },
  {
    icon: NotebookPen ,
    title: "Department analytics",
    description:
      "Admins monitor completion trends, supervisor workload, late submissions, project risk, evaluation rubrics, and audit history.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          One workspace for every research decision.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Researcher combines academic supervision, document intelligence, project execution, and institutional oversight without scattering work across chat apps, spreadsheets, shared folders, and disconnected AI tools.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="size-5 text-primary" aria-hidden />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}


