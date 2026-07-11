"use client"
import { Send } from "lucide-react"
import { type FormEvent, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { replyToFeedback } from "../actions"
export function FeedbackResponseForm({ feedbackId }: { feedbackId: string }) { const [body, setBody] = useState(""); const [error, setError] = useState<string | null>(null); const [pending, startTransition] = useTransition(); function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); startTransition(async () => { const result = await replyToFeedback({ feedbackId, body }); if (!result.success) return setError(result.error); setBody(""); setError(null) }) } return <form onSubmit={submit} className="mt-3"><div className="flex items-end gap-2"><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Reply to your supervisor…" rows={2} maxLength={2_000} disabled={pending} className="min-h-16 resize-none" /><Button type="submit" size="icon" disabled={pending || body.trim().length < 2} aria-label="Send response"><Send /></Button></div>{error ? <p className="mt-1 text-[10px] text-destructive">{error}</p> : null}</form> }
