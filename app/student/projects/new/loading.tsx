import { Card, CardContent } from "@/components/ui/card"

export default function NewProjectLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8" aria-label="Loading project form">
      <div className="space-y-2"><div className="h-3 w-40 animate-pulse rounded bg-muted" /><div className="h-9 w-80 max-w-full animate-pulse rounded bg-muted" /><div className="h-4 w-[32rem] max-w-full animate-pulse rounded bg-muted" /></div>
      <Card><CardContent className="space-y-5 pt-4">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded bg-muted" />)}</CardContent></Card>
      <div className="grid gap-6 xl:grid-cols-2">{Array.from({ length: 2 }).map((_, index) => <Card key={index}><CardContent className="h-72 animate-pulse bg-muted/50" /></Card>)}</div>
    </main>
  )
}
