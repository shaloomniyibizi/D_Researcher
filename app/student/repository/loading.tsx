import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RepositoryLoading() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Loading research repository">
      <div className="h-56 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Card key={index} size="sm"><CardHeader><div className="h-3 w-24 rounded bg-muted" /></CardHeader><CardContent><div className="h-6 w-10 rounded bg-muted" /></CardContent></Card>)}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Card key={index} className="min-h-72"><CardContent className="space-y-4 pt-4"><div className="h-5 w-24 animate-pulse rounded bg-muted" /><div className="h-12 animate-pulse rounded bg-muted" /><div className="h-20 animate-pulse rounded bg-muted" /></CardContent></Card>)}</div>
    </main>
  )
}
