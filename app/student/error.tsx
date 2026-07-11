"use client"

import { useEffect } from "react"

import { DatabaseUnavailable } from "@/components/shared/database-unavailable"

export default function StudentError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return <DatabaseUnavailable />
}
