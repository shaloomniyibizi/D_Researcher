import { GraduationCap, LogOut, MessageCircle } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { UserRole } from "@/generated/prisma/client"
import { getServerSession } from "@/lib/server-session"

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(await headers())
  if (!session) redirect("/auth?mode=sign-in")
  if (session.user.role !== UserRole.SUPERVISOR) redirect("/onboarding")

  return <div className="min-h-screen bg-background"><header className="border-b bg-card"><div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4"><Link href="/supervisor/chat" className="flex items-center gap-2 font-heading text-sm font-semibold"><span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><GraduationCap className="size-4" /></span>Researcher</Link><nav className="ml-auto flex items-center gap-2 text-xs"><Link href="/supervisor/chat" className="flex items-center gap-2 rounded-md bg-muted px-3 py-2"><MessageCircle className="size-4" />Project chat</Link><Link href="/auth?mode=sign-in" className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"><LogOut className="size-4" />Account</Link></nav></div></header><main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main></div>
}
