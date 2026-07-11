import { Card, CardContent } from "@/components/ui/card"

export default function DocumentsLoading() {
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="h-20 animate-pulse rounded bg-muted" />
      <div className="h-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="h-56 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    </main>
  )
}
