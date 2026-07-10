"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Lightbulb, Loader2, Save, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-toastify"
import { z } from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import CustomFormField, { FormFieldType } from "@/components/shared/custom-form-field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { SelectItem } from "@/components/ui/select"

import { createProject, updateProject } from "../actions"
import type { EditableStudentProject, SupervisorOption } from "../types"

const formSchema = z.object({
  title: z.string().trim().min(5, "Project title must be at least 5 characters.").max(180),
  abstract: z.string().trim().max(2_000, "Abstract must be 2,000 characters or fewer."),
  problemStatement: z.string().trim().max(3_000, "Problem statement must be 3,000 characters or fewer."),
  objectives: z.string().trim().max(2_000),
  keywords: z.string().trim().max(500),
  visibility: z.enum(["PRIVATE", "DEPARTMENT", "INSTITUTION", "PUBLIC"]),
  supervisorId: z.string(),
})

type CreateProjectFormValues = z.infer<typeof formSchema>

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function objectivesToHtml(objectives: string[]): string {
  if (objectives.length === 0) return ""
  return `<ol>${objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join("")}</ol>`
}

export function CreateProjectForm({
  supervisors,
  project,
}: {
  supervisors: SupervisorOption[]
  project?: EditableStudentProject
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const isEditing = Boolean(project)
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title ?? "",
      abstract: project?.abstract ?? "",
      problemStatement: project?.problemStatement ?? "",
      objectives: objectivesToHtml(project?.objectives ?? []),
      keywords: project?.keywords.join(", ") ?? "",
      visibility: project?.visibility ?? "PRIVATE",
      supervisorId: project?.supervisorId ?? "unassigned",
    },
  })
  async function onSubmit(values: CreateProjectFormValues) {
    setIsPending(true)
    const payload = {
      ...values,
      supervisorId: values.supervisorId === "unassigned" ? "" : values.supervisorId,
    }
    const result = project
      ? await updateProject(project.id, payload)
      : await createProject(payload)
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEditing ? "Project updated successfully." : "Project created successfully.")
    router.replace(isEditing ? `/student/projects/${result.data.projectId}` : `/student?created=${result.data.projectId}`)
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Project foundation</CardTitle>
          <CardDescription>{isEditing ? "Update the working title and research foundation." : "Start with a clear working title and a concise description of the research."}</CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          <FieldGroup>
            <CustomFormField
              control={form.control}
              name="title"
              label="Project title"
              placeholder="e.g. AI-assisted early disease detection for community clinics"
              description="Use a specific working title. You can refine it later."
              autoFocus
              fieldType={FormFieldType.INPUT}
            />

            <CustomFormField
              control={form.control}
              name="abstract"
              label="Abstract (optional)"
              placeholder="Summarize the context, proposed approach, and expected contribution."
              description="Describe the context, approach, and expected contribution."
              fieldType={FormFieldType.TEXTAREA}
            />

            <CustomFormField
              control={form.control}
              name="problemStatement"
              label="Problem statement (optional)"
              placeholder="What problem exists, who is affected, and why does it matter?"
              description="Explain the problem and why it is worth investigating."
              fieldType={FormFieldType.TEXTAREA}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Research direction</CardTitle>
            <CardDescription>Optional details help structure your idea brief and future AI suggestions.</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <FieldGroup>
              <CustomFormField
                control={form.control}
                name="objectives"
                label="Initial objectives (optional)"
                placeholder="List the initial objectives for this research."
                description="Use a list or separate objectives with new lines, up to 12."
                fieldType={FormFieldType.TEXTAREA}
              />
              <CustomFormField
                control={form.control}
                name="keywords"
                label="Keywords (optional)"
                placeholder="health informatics, machine learning, accessibility"
                description="Separate keywords with commas."
                fieldType={FormFieldType.INPUT}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Supervision and access</CardTitle>
            <CardDescription>Choose who can initially discover the project and optionally request a supervisor.</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            <FieldGroup>
              <CustomFormField
                control={form.control}
                name="supervisorId"
                label="Preferred supervisor (optional)"
                placeholder="Select a supervisor"
                description="Only active supervisors in your department are available."
                fieldType={FormFieldType.SELECT}
              >
                <SelectItem value="unassigned">Choose later</SelectItem>
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name} — {supervisor.email}</SelectItem>
                ))}
              </CustomFormField>

              <CustomFormField
                control={form.control}
                name="visibility"
                label="Project visibility"
                description="Choose who can discover the project."
                fieldType={FormFieldType.SELECT}
              >
                <SelectItem value="PRIVATE">Private — only project members</SelectItem>
                <SelectItem value="DEPARTMENT">Department — visible in your department</SelectItem>
                <SelectItem value="INSTITUTION">Institution — visible across your university</SelectItem>
                <SelectItem value="PUBLIC">Public — visible in the public repository</SelectItem>
              </CustomFormField>

              <Alert>
                <ShieldCheck />
                <AlertTitle>Starts securely</AlertTitle>
                <AlertDescription>
                  New projects begin in the idea stage. Visibility can be changed later, subject to institutional review.
                </AlertDescription>
              </Alert>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-3 z-10 flex flex-col-reverse justify-between gap-3 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center">
        <Button type="button" variant="ghost" asChild disabled={isPending}>
          <Link href={project ? `/student/projects/${project.id}` : "/student"}><ArrowLeft /> Cancel</Link>
        </Button>
        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex"><Lightbulb className="size-3.5" /> An idea brief milestone will be created automatically.</p>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
            {isPending ? (isEditing ? "Saving changes..." : "Creating project...") : (isEditing ? "Save changes" : "Create project")}
          </Button>
        </div>
      </div>
    </form>
  )
}
