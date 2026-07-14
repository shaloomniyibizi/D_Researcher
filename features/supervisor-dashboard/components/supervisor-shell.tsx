"use client";

import {
  Bell,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareText,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { SupervisorProfile } from "../types";

const navigation = [
  { label: "Dashboard", href: "/supervisor", icon: LayoutDashboard },
  { label: "Supervised projects", href: "/supervisor/projects", icon: FolderKanban },
  { label: "Feedback", href: "/supervisor/feedback", icon: MessageSquareText },
  { label: "Chat", href: "/supervisor/chat", icon: MessageCircle },
  { label: "Notifications", href: "/supervisor/notifications", icon: Bell },
] as const;

function Sidebar({ mobile, close }: { mobile?: boolean; close?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    const result = await signOut();
    if (result.error) return setPending(false);
    router.replace("/auth?mode=sign-in");
    router.refresh();
  }
  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r bg-sidebar",
        mobile ? "flex h-full flex-col" : "hidden lg:flex lg:flex-col",
      )}
    >
      <Link
        href="/supervisor"
        className="flex h-16 items-center gap-3 border-b px-5"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        <span>
          <span className="block font-heading text-sm font-semibold">
            Researcher
          </span>
          <span className="block text-[11px] text-muted-foreground">
            Supervisor workspace
          </span>
        </span>
        {mobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={close}
            aria-label="Close menu"
          >
            <X />
          </Button>
        ) : null}
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Supervisor navigation">
        {navigation.map((item) => {
          const active =
            item.href === "/supervisor"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent",
                active &&
                  "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <button
          type="button"
          onClick={logout}
          disabled={pending}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          {pending ? "Signing out…" : "Log out"}
        </button>
      </div>
    </aside>
  );
}

export function SupervisorShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: SupervisorProfile;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-svh bg-muted/30">
      <Sidebar />
      {open ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-64">
            <Sidebar mobile close={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center gap-3 border-b bg-background px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {profile.department?.institution.name}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
              <Link href="/supervisor/notifications"><Bell /></Link>
            </Button>
            <Avatar size="lg">
              {profile.image ? (
                <AvatarImage src={profile.image} alt={profile.name} />
              ) : null}
              <AvatarFallback>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-xs font-medium">{profile.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {profile.staffNumber ?? "Supervisor"}
              </p>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
