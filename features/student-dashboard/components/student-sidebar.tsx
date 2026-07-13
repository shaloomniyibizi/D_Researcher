"use client"

import {
  Bell,
  Bot,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  Lightbulb,
  MessageCircle,
  MessageSquareText,
  Loader2,
  LogOut,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const navigation = [
  { label: "Overview", href: "/student", icon: LayoutDashboard },
  { label: "My research", href: "/student/projects", icon: FolderKanban },
  { label: "AI workspace", href: "/student/ai", icon: Bot },
  { label: "Idea generator", href: "/student/ideas", icon: Lightbulb },
  { label: "Chat with PDF", href: "/student/documents", icon: FileText },
  { label: "chat room", href: "/student/chat", icon: MessageCircle },
  { label: "Feedback", href: "/student/feedback", icon: MessageSquareText },
  { label: "Repository", href: "/student/repository", icon: Library },
  { label: "Notifications", href: "/student/notifications", icon: Bell },
] as const

type StudentSidebarProps = {
  mobile?: boolean
  onNavigate?: () => void
}

export function StudentSidebar({ mobile = false, onNavigate }: StudentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleLogout() {
    setIsSigningOut(true)

    const result = await signOut()

    if (result.error) {
      setIsSigningOut(false)
      return
    }

    router.replace("/auth?mode=sign-in")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r bg-sidebar",
        mobile ? "flex h-full flex-col" : "hidden lg:flex lg:flex-col",
      )}
    >
      <Link href="/student" className="flex h-16 items-center gap-3 border-b px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        <span>
          <span className="block font-heading text-sm font-semibold">Researcher</span>
          <span className="block text-[11px] text-muted-foreground">Student workspace</span>
        </span>
        {mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-label="Close navigation menu"
            onClick={onNavigate}
          >
            <X />
          </Button>
        ) : null}
      </Link>

      <nav className="flex-1 space-y-1 p-3" aria-label="Student navigation">
        {navigation.map((item) => (
          (() => {
            const active = item.href === "/student"
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })()
        ))}
      </nav>

      <div className="border-t p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          {isSigningOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          {isSigningOut ? "Signing out..." : "Log out"}
        </button>
      </div>
    </aside>
  )
}
