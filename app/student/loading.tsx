import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function StudentDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Loading student dashboard">
      <div className="space-y-2"><div className="h-4 w-32 animate-pulse rounded bg-muted" /><div className="h-8 w-72 animate-pulse rounded bg-muted" /><div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Card key={index} size="sm"><CardHeader><div className="h-3 w-24 animate-pulse rounded bg-muted" /></CardHeader><CardContent><div className="h-7 w-16 animate-pulse rounded bg-muted" /></CardContent></Card>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]"><Card className="min-h-96"><CardContent className="space-y-5 pt-4">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded bg-muted" />)}</CardContent></Card><Card className="min-h-72"><CardContent className="space-y-4 pt-4">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded bg-muted" />)}</CardContent></Card></div>
    </main>
  )
}
