import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
// import { LandingMobileNav } from "@/components/landing/landing-mobile-nav"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#roles", label: "Roles" },
  { href: "#showcase", label: "Showcase" },
]

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-heading text-base font-medium tracking-tight text-foreground"
        >
          Researcher
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>

        {/* <LandingMobileNav
          navLinks={navLinks}
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu />
            </Button>
          }
        /> */}
      </div>
    </header>
  )
}
