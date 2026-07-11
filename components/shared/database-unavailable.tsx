"use client"

import { Database, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function DatabaseUnavailable() {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  function retry() {
    setIsRetrying(true)
    router.refresh()
    window.setTimeout(() => setIsRetrying(false), 2_000)
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Database className="size-5" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold">Database temporarily unavailable</h1>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Researcher could not connect to the database service. Your data is safe; wait a moment and try again.
        </p>
        <Button className="mt-5" onClick={retry} disabled={isRetrying}>
          <RefreshCw className={isRetrying ? "animate-spin" : undefined} />
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </main>
  )
}
