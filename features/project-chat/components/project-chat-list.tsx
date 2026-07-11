import { MessageCircle } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import type { ProjectChatRoom } from "../types"

export function ProjectChatList({ rooms, basePath }: { rooms: ProjectChatRoom[]; basePath: string }) {
  return (
    <div className="space-y-5">
      <div><h1 className="font-heading text-xl font-semibold">Project chat</h1><p className="mt-1 text-xs text-muted-foreground">Private conversations between research teams and supervisors.</p></div>
      <Card>
        <CardHeader><CardTitle>Conversations</CardTitle><CardDescription>Select a supervised project to continue the discussion.</CardDescription></CardHeader>
        <CardContent className="divide-y p-0">
          {rooms.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-6 text-center"><div><MessageCircle className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No chatrooms yet</p><p className="mt-1 text-xs text-muted-foreground">A room appears when a supervisor is assigned to a project.</p></div></div>
          ) : rooms.map((room) => (
            <Link key={room.id} href={`${basePath}/${room.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
              <Avatar>{room.counterpartImage ? <AvatarImage src={room.counterpartImage} alt={room.counterpartName ?? "Participant"} /> : null}<AvatarFallback>{room.counterpartName?.charAt(0).toUpperCase() ?? <MessageCircle className="size-4" />}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-medium">{room.title}</p>{room.lastMessageAt ? <time className="shrink-0 text-[10px] text-muted-foreground">{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(room.lastMessageAt)}</time> : null}</div><p className="mt-1 truncate text-[11px] text-muted-foreground">{room.lastMessage ?? (room.counterpartName ? `Chat with ${room.counterpartName}` : "Supervisor not assigned")}</p></div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
