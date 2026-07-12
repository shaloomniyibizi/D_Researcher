import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Code2,
  Database,
  ExternalLink,
  FileText,
  FolderArchive,
  GraduationCap,
  Library,
  Search,
  SlidersHorizontal,
  UserRound,
  Plus,
} from "lucide-react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PastProjectCard } from "@/features/repository/components/past-project-card"
import { RepositoryChatbot } from "@/features/repository/components/repository-chatbot"
import { getStudentRepository } from "@/features/repository/repositories/repository-repository"
import { getRepositoryChatHistory } from "@/features/repository/repositories/repository-chat-repository"
import type { RepositoryFilters } from "@/features/repository/types"
import { RepositoryRecordType } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Research Repository | Researcher",
  description: "Discover past projects, papers, datasets, and capstone research from your institution.",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const filterSchema = z.object({
  query: z.string().trim().max(120).optional(),
  type: z.enum(RepositoryRecordType).optional(),
  departmentId: z.string().trim().max(100).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  page: z.coerce.number().int().positive().catch(1),
})

const TYPE_DETAILS = {
  PAST_PROJECT: { label: "Past projects", icon: FolderArchive },
  RESEARCH_PAPER: { label: "Research papers", icon: BookOpenText },
  CAPSTONE_REPORT: { label: "Capstone reports", icon: GraduationCap },
  DATASET: { label: "Datasets", icon: Database },
  CODE_REPOSITORY: { label: "Code repositories", icon: Code2 },
} as const satisfies Record<RepositoryRecordType, { label: string; icon: typeof Library }>

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseFilters(params: Record<string, string | string[] | undefined>): RepositoryFilters {
  const parsed = filterSchema.safeParse({
    query: firstValue(params.query) || undefined,
    type: firstValue(params.type) || undefined,
    departmentId: firstValue(params.department) || undefined,
    year: firstValue(params.year) || undefined,
    page: firstValue(params.page) || 1,
  })

  return parsed.success ? parsed.data : { page: 1 }
}

function createRepositoryUrl(filters: RepositoryFilters, updates: Partial<RepositoryFilters>): string {
  const next = { ...filters, ...updates }
  const params = new URLSearchParams()

  if (next.query) params.set("query", next.query)
  if (next.type) params.set("type", next.type)
  if (next.departmentId) params.set("department", next.departmentId)
  if (next.year) params.set("year", String(next.year))
  if (next.page > 1) params.set("page", String(next.page))

  const query = params.toString()
  return query ? `/student/repository?${query}` : "/student/repository"
}

function formatType(type: RepositoryRecordType): string {
  return TYPE_DETAILS[type].label.replace(/s$/, "")
}

export default async function StudentRepositoryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== "STUDENT") notFound()

  const filters = parseFilters(await searchParams)
  const data = await getStudentRepository(session.user.id, filters)
  const chatHistory = await getRepositoryChatHistory(session.user.id)

  if (!data) redirect("/onboarding")

  const firstResult = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1
  const lastResult = Math.min(data.page * data.pageSize, data.total)

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-lg border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
            <Library className="size-4" /> {data.institution.name}
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Research repository</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Build on previous work by exploring institutional projects, papers, datasets, reports, and source code.
          </p>
        </div><Button asChild><Link href="/student/repository/new"><Plus /> Add past project</Link></Button></div>

        <form method="get" className="mt-6 grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_200px_130px_auto]">
          <label className="relative">
            <span className="sr-only">Search repository</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="query" defaultValue={filters.query} placeholder="Search title, author, topic..." className="pl-9" />
          </label>
          <label>
            <span className="sr-only">Record type</span>
            <select name="type" defaultValue={filters.type ?? ""} className="h-8 w-full border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50">
              <option value="">All record types</option>
              {Object.entries(TYPE_DETAILS).map(([value, detail]) => <option key={value} value={value}>{detail.label}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Department</span>
            <select name="department" defaultValue={filters.departmentId ?? ""} className="h-8 w-full border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50">
              <option value="">All departments</option>
              {data.departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Publication year</span>
            <select name="year" defaultValue={filters.year ?? ""} className="h-8 w-full border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50">
              <option value="">All years</option>
              {data.years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <Button type="submit"><SlidersHorizontal /> Apply</Button>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Repository record types">
        {(Object.entries(TYPE_DETAILS) as Array<[RepositoryRecordType, (typeof TYPE_DETAILS)[RepositoryRecordType]]>).map(([type, detail]) => {
          const active = filters.type === type
          return (
            <Link key={type} href={createRepositoryUrl(filters, { type: active ? undefined : type, page: 1 })}>
              <Card size="sm" className={cn("h-full transition-colors hover:ring-primary/40", active && "bg-primary/5 ring-primary/50")}>
                <CardHeader><CardDescription>{detail.label}</CardDescription><CardAction><detail.icon className="size-4 text-primary" /></CardAction></CardHeader>
                <CardContent><p className="font-heading text-xl font-semibold">{data.countsByType[type] ?? 0}</p></CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div><h2 className="font-heading text-lg font-semibold">Browse research</h2><p className="text-xs text-muted-foreground">Showing {firstResult}–{lastResult} of {data.total} records</p></div>
          {(filters.query || filters.type || filters.departmentId || filters.year) ? <Button variant="ghost" size="sm" asChild><Link href="/student/repository">Clear filters</Link></Button> : null}
        </div>

        {data.records.length === 0 ? (
          <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted"><Search className="size-5 text-muted-foreground" /></span><h3 className="text-sm font-medium">No repository records found</h3><p className="mt-1 text-xs text-muted-foreground">Try a broader search or remove one of the filters.</p><Button variant="outline" size="sm" className="mt-4" asChild><Link href="/student/repository">Reset search</Link></Button></div></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.records.map((record) => {
              const detail = TYPE_DETAILS[record.type]
              const destination = record.fileUrl ?? record.externalUrl

              if (record.type === "PAST_PROJECT") {
                return (
                  <PastProjectCard
                    key={record.id}
                    title={record.title}
                    abstract={record.abstract}
                    authors={record.authors}
                    year={record.year}
                    publishedAt={record.publishedAt}
                    institutionName={data.institution.name}
                    departmentName={record.department?.name ?? null}
                    technologies={record.technologies}
                    supervisorName={record.supervisorName}
                    destination={destination}
                    className="h-full transition-shadow hover:shadow-sm"
                  />
                )
              }

              return (
                <Card key={record.id} className="h-full transition-shadow hover:shadow-sm">
                  <CardHeader className="border-b">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary"><detail.icon className="size-3" /> {formatType(record.type)}</span>
                      {record.year ? <span className="text-[10px] text-muted-foreground">{record.year}</span> : null}
                    </div>
                    <CardTitle className="line-clamp-2 text-base leading-snug">{record.title}</CardTitle>
                    <CardDescription className="line-clamp-3 min-h-[3.75rem]">{record.abstract ?? "No abstract is available for this repository record."}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 pt-1">
                    <div className="space-y-2 text-[11px] text-muted-foreground">
                      {record.authors.length > 0 ? <p className="flex items-start gap-2"><UserRound className="mt-0.5 size-3.5 shrink-0" /><span className="line-clamp-2">{record.authors.join(", ")}</span></p> : null}
                      {record.department ? <p className="flex items-center gap-2"><GraduationCap className="size-3.5 shrink-0" />{record.department.name}</p> : null}
                      {record.supervisorName ? <p className="flex items-center gap-2"><FileText className="size-3.5 shrink-0" />Supervised by {record.supervisorName}</p> : null}
                    </div>
                    {record.technologies.length > 0 ? <div className="flex flex-wrap gap-1.5">{record.technologies.slice(0, 4).map((technology) => <span key={technology} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{technology}</span>)}</div> : null}
                    <div className="mt-auto border-t pt-4">
                      {destination ? <Button variant="outline" size="sm" className="w-full" asChild><a href={destination} target="_blank" rel="noreferrer">Open record <ExternalLink /></a></Button> : <Button variant="outline" size="sm" className="w-full" disabled>File unavailable</Button>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {data.totalPages > 1 ? (
        <nav className="flex items-center justify-between border-t pt-5" aria-label="Repository pagination">
          <Button variant="outline" size="sm" disabled={data.page <= 1} asChild={data.page > 1}>
            {data.page > 1 ? <Link href={createRepositoryUrl(filters, { page: data.page - 1 })}><ArrowLeft /> Previous</Link> : <span><ArrowLeft /> Previous</span>}
          </Button>
          <p className="text-xs text-muted-foreground">Page <span className="font-medium text-foreground">{data.page}</span> of {data.totalPages}</p>
          <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} asChild={data.page < data.totalPages}>
            {data.page < data.totalPages ? <Link href={createRepositoryUrl(filters, { page: data.page + 1 })}>Next <ArrowRight /></Link> : <span>Next <ArrowRight /></span>}
          </Button>
        </nav>
      ) : null}
      <RepositoryChatbot initialConversationId={chatHistory.conversationId} initialMessages={chatHistory.messages} user={{ name: session.user.name, image: session.user.image ?? null }} />
    </main>
  )
}
