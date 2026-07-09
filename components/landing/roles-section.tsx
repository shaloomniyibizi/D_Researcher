import { GraduationCap, ShieldCheck, UserCheck } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const roles = [
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Manage your projects, submit milestones, collaborate with peers, and access AI tools to strengthen your research.",
    highlights: [
      "Own project workspace",
      "AI writing assistance",
      "Milestone tracking",
    ],
  },
  {
    icon: UserCheck,
    title: "Supervisors",
    description:
      "Oversee assigned students, provide structured feedback, and monitor progress across all your supervisees.",
    highlights: [
      "Student dashboards",
      "Feedback tools",
      "Progress analytics",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Administrators",
    description:
      "Manage users, configure institutional settings, and access platform-wide analytics and reporting.",
    highlights: [
      "User management",
      "Full platform access",
      "Institutional analytics",
    ],
  },
]

export function RolesSection() {
  return (
    <section id="roles" className="bg-muted/30 border-b py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Built for every role
          </p>
          <h2 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            One platform, three perspectives
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Role-based access ensures everyone sees exactly what they need —
            nothing more, nothing less.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {roles.map(({ icon: Icon, title, description, highlights }) => (
            <Card key={title} className="flex flex-col">
              <CardHeader className="flex-1">
                <Icon className="size-5 text-primary" aria-hidden />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
                <ul className="mt-4 space-y-1.5 border-t pt-4">
                  {highlights.map((item) => (
                    <li
                      key={item}
                      className="text-xs text-muted-foreground before:mr-2 before:text-primary before:content-['—']"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
