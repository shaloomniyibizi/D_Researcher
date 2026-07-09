"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type NavLink = {
  href: string
  label: string
}

type LandingMobileNavProps = {
  navLinks: NavLink[]
  trigger: ReactNode
}

export function LandingMobileNav({ navLinks, trigger }: LandingMobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-6 sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-heading">Menu</DialogTitle>
        </DialogHeader>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t pt-4">
          <Button asChild variant="outline">
            <Link href="/sign-in" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up" onClick={() => setOpen(false)}>
              Get started
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
