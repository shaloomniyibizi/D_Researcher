"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, History, Lightbulb, Loader2, Save, Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import CustomFormField, { FormFieldType } from "@/components/shared/custom-form-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { discardGeneratedIdeas, generateProjectIdeas, saveGeneratedIdea } from "../actions"
import type { IdeaGeneration, ResearchIdea } from "../types"

const ideaCriteriaSchema = z.object({
  discipline: z.string().trim().min(2, "Enter a discipline.").max(120),
  interests: z.string().trim().min(3, "Enter at least one research interest.").max(500),
  problemArea: z.string().max(2_000),
  technologies: z.string().trim().max(300),
  constraints: z.string().max(2_000),
})

type IdeaCriteria = z.infer<typeof ideaCriteriaSchema>

function richTextToPlainText(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html")
  return document.body.textContent?.replace(/\u00a0/g, " ").trim() ?? ""
}

function projectUrl(idea: ResearchIdea) { const params = new URLSearchParams({ title: idea.title, problemStatement: idea.problemStatement, abstract: `${idea.proposedApproach}\n\nExpected contribution: ${idea.expectedContribution}`, objectives: idea.objectives.join("\n"), keywords: idea.keywords.join(", ") }); return `/student/projects/new?${params}` }
function IdeaCards({ ideas }: { ideas: ResearchIdea[] }) { return <div className="grid gap-4 lg:grid-cols-2">{ideas.map((idea, index) => <Card key={`${idea.title}-${index}`}><CardHeader><div className="flex items-start justify-between gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Lightbulb className="size-4" /></span><span className={cn("rounded-full px-2 py-0.5 text-[10px]", idea.feasibility === "HIGH" ? "bg-primary/10 text-primary" : idea.feasibility === "MEDIUM" ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive")}>{idea.feasibility.toLowerCase()} feasibility</span></div><CardTitle className="mt-3 leading-snug">{idea.title}</CardTitle><CardDescription>{idea.problemStatement}</CardDescription></CardHeader><CardContent className="space-y-4"><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Proposed approach</p><p className="mt-1 text-xs leading-relaxed">{idea.proposedApproach}</p></div><div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Objectives</p><ul className="mt-1 list-disc space-y-1 pl-4 text-xs">{idea.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div><div className="flex flex-wrap gap-1">{idea.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{keyword}</span>)}</div><Button className="w-full" asChild><Link href={projectUrl(idea)}>Use this idea <ArrowRight /></Link></Button></CardContent></Card>)}</div> }

export function IdeaGenerator({ context, history, configured }: { context: { discipline: string; interests: string }; history: IdeaGeneration[]; configured: boolean }) {
  const [generation, setGeneration] = useState<IdeaGeneration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const form = useForm<IdeaCriteria>({
    resolver: zodResolver(ideaCriteriaSchema),
    defaultValues: { discipline: context.discipline, interests: context.interests, problemArea: "", technologies: "", constraints: "" },
  })
  function submit(values: IdeaCriteria) { setError(null); startTransition(async () => { const result = await generateProjectIdeas({ ...values, problemArea: richTextToPlainText(values.problemArea), constraints: richTextToPlainText(values.constraints) }); if (!result.success) return setError(result.error); setGeneration(result.data) }) }
  function save(index: number) { if (!generation) return; setError(null); startTransition(async () => { const result = await saveGeneratedIdea({ jobId: generation.id, ideaIndex: index }); if (!result.success) return setError(result.error); setGeneration(null) }) }
  function discard() { if (!generation) return; setError(null); startTransition(async () => { const result = await discardGeneratedIdeas({ jobId: generation.id }); if (!result.success) return setError(result.error); setGeneration(null) }) }
  return <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-xs font-medium text-primary">Researcher AI</p><h1 className="mt-1 font-heading text-2xl font-semibold">Project idea generator</h1><p className="mt-1 text-sm text-muted-foreground">Turn your interests and constraints into feasible final-year research directions.</p></div><div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"><Card className="h-fit"><CardHeader><CardTitle>Generation criteria</CardTitle><CardDescription>Specific context produces stronger, more practical ideas.</CardDescription></CardHeader><CardContent><form onSubmit={form.handleSubmit(submit)} className="space-y-4"><FieldGroup><CustomFormField control={form.control} name="discipline" label="Discipline" fieldType={FormFieldType.INPUT} /><CustomFormField control={form.control} name="interests" label="Research interests" placeholder="AI, public health, agriculture…" fieldType={FormFieldType.INPUT} /><CustomFormField control={form.control} name="problemArea" label="Problem area (optional)" placeholder="A community or industry problem you want to solve" fieldType={FormFieldType.TEXTAREA} /><CustomFormField control={form.control} name="technologies" label="Technologies or methods (optional)" placeholder="Machine learning, surveys, IoT…" fieldType={FormFieldType.INPUT} /><CustomFormField control={form.control} name="constraints" label="Constraints (optional)" placeholder="Timeline, budget, data access…" fieldType={FormFieldType.TEXTAREA} /></FieldGroup>{error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}<Button type="submit" className="w-full" disabled={!configured || pending}>{pending ? <Loader2 className="animate-spin" /> : <Sparkles />}{pending ? "Generating ideas…" : "Generate ideas"}</Button>{!configured ? <p className="text-[10px] text-destructive">Gemini is not configured on this server.</p> : null}</form></CardContent></Card><section className="space-y-4">{generation ? <><div><h2 className="font-heading text-lg font-semibold">Generated ideas</h2><p className="text-xs text-muted-foreground">Compare the options and refine the strongest direction with your supervisor.</p></div><IdeaCards ideas={generation.ideas} /><div className="flex flex-wrap gap-2">{generation.ideas.map((idea, index) => <Button key={idea.title} type="button" variant="outline" onClick={() => save(index)} disabled={pending}><Save /> Save idea {index + 1}</Button>)}<Button type="button" variant="ghost" onClick={discard} disabled={pending}><Trash2 /> Discard all</Button></div></> : <Card><CardContent className="grid min-h-80 place-items-center text-center"><div><Sparkles className="mx-auto size-9 text-primary" /><h2 className="mt-3 text-sm font-semibold">Ready to explore research directions</h2><p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">Complete the criteria to generate four structured, feasible project ideas.</p></div></CardContent></Card>}{history.length > 0 ? <details className="rounded-lg border bg-card"><summary className="flex cursor-pointer items-center gap-2 p-4 text-xs font-medium"><History className="size-4" />Previous generations ({history.length})</summary><div className="border-t p-4"><IdeaCards ideas={history[0]?.ideas ?? []} /></div></details> : null}</section></div></main>
}
