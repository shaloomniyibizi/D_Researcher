import { ArrowLeft, SearchX } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SupervisorNotFound() {
  return (
    <main className="grid min-h-[calc(100svh-4rem)] place-items-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="py-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-6" />
          </span>
          <p className="mt-5 text-xs font-medium text-primary">404 · Supervisor workspace</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold">Workflow not available yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            This supervisor workflow has not been implemented. Use the dashboard to continue reviewing active student research.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/supervisor"><ArrowLeft /> Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
