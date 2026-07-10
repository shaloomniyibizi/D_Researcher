"use client"

import { LogInIcon, UserPlus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignInForm } from "@/components/web/form/sign-in-form"
import { SignUpForm } from "@/components/web/form/sign-up-form"

export type AuthMode = "sign-in" | "sign-up"

type AuthTabsProps = {
  initialMode: AuthMode
}

function isAuthMode(value: string | null): value is AuthMode {
  return value === "sign-in" || value === "sign-up"
}

export function AuthTabs({ initialMode }: AuthTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlMode = searchParams.get("mode")
  const mode = isAuthMode(urlMode) ? urlMode : initialMode

  function handleModeChange(value: string) {
    if (!isAuthMode(value)) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("mode", value)
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="sign-in">
          <LogInIcon /> Sign In
        </TabsTrigger>
        <TabsTrigger value="sign-up">
          <UserPlus /> Sign Up
        </TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        <SignInForm />
      </TabsContent>
      <TabsContent value="sign-up">
        <SignUpForm />
      </TabsContent>
    </Tabs>
  )
}
