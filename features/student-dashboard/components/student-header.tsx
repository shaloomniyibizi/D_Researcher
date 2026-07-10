import { Bell, Menu, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { StudentShellProfile } from "../types"

export function StudentHeader({
  profile,
  onMenuOpen,
}: {
  profile: StudentShellProfile
  onMenuOpen: () => void
}) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        onClick={onMenuOpen}
      >
        <Menu />
      </Button>
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search research, papers, and tasks..." aria-label="Search workspace" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="View notifications">
          <Bell />
        </Button>
        <div className="h-7 w-px bg-border" />
        <Avatar size="lg">
          {profile.image ? <AvatarImage src={profile.image} alt={`${profile.name}'s profile`} /> : null}
          <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-xs font-medium">{profile.name}</p>
          <p className="text-[11px] text-muted-foreground">{profile.studentNumber ?? "Student"}</p>
        </div>
      </div>
    </header>
  )
}
