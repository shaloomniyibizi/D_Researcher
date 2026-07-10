"use client"

import { useEffect, useState } from "react"

import { StudentHeader } from "./student-header"
import { StudentSidebar } from "./student-sidebar"
import type { StudentShellProfile } from "../types"

type StudentShellProps = {
  children: React.ReactNode
  profile: StudentShellProfile
}

export function StudentShell({ children, profile }: StudentShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-svh bg-muted/30">
      <StudentSidebar />

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Student navigation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-64 max-w-[85vw] shadow-xl">
            <StudentSidebar mobile onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <StudentHeader profile={profile} onMenuOpen={() => setMenuOpen(true)} />
        {children}
      </div>
    </div>
  )
}
