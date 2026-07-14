"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Camera, Loader2, UserCheck } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "react-toastify"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing"

import { completeOnboarding } from "../actions"
import type { DepartmentOption, OnboardingProfile } from "../types"

const onboardingFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  departmentId: z.string().min(1, "Select your department."),
  studentNumber: z.string().trim().max(50).optional(),
  staffNumber: z.string().trim().max(50).optional(),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be 500 characters or fewer.")
    .optional(),
  researchInterests: z
    .string()
    .trim()
    .max(500)
    .optional(),
})

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>
type OnboardingFormProps = {
  user: OnboardingProfile
  departments: DepartmentOption[]
  className?: string
}

const STEPS = [
  { title: "Account", fields: ["name"] },
  { title: "Academic", fields: ["departmentId"] },
  { title: "Research", fields: ["researchInterests", "bio"] },
  { title: "Review", fields: [] },
] as const satisfies ReadonlyArray<{
  title: string
  fields: ReadonlyArray<keyof OnboardingFormValues>
}>

function getRoleHome(role: OnboardingProfile["role"]): string {
  if (role === "ADMIN") return "/admin"
  if (role === "SUPERVISOR") return "/supervisor"
  return "/student"
}

function formatRole(role: OnboardingProfile["role"]): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export function OnboardingForm({
  user,
  departments,
  className,
}: OnboardingFormProps) {
  const [step, setStep] = useState(0)
  const [isPending, setIsPending] = useState(false)
  const [imageUrl, setImageUrl] = useState(user.image)
  const isStudent = user.role === "STUDENT"

  const { startUpload, isUploading } = useUploadThing("profileImage", {
    onClientUploadComplete: (files) => {
      const uploadedImageUrl = files[0]?.serverData.imageUrl

      if (uploadedImageUrl) {
        setImageUrl(uploadedImageUrl)
        toast.success("Profile image uploaded.")
      }
    },
    onUploadError: (error) => {
      toast.error(error.message || "Could not upload profile image.")
    },
  })

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      name: user.name,
      departmentId: user.departmentId ?? "",
      studentNumber: user.studentNumber ?? "",
      staffNumber: user.staffNumber ?? "",
      bio: user.bio ?? "",
      researchInterests: user.researchInterests.join(", "),
    },
  })

  const values = useWatch({ control: form.control })
  const selectedDepartment = departments.find(
    (department) => department.id === values.departmentId,
  )

  async function goNext() {
    const fields: Array<keyof OnboardingFormValues> = [...STEPS[step].fields]
    if (step === 1) fields.push(isStudent ? "studentNumber" : "staffNumber")

    if (fields.length === 0 || (await form.trigger(fields))) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1))
    }
  }

  async function onSubmit(valuesToSave: OnboardingFormValues) {
    setIsPending(true)
    const result = await completeOnboarding(valuesToSave)
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error ?? "Could not complete onboarding.")
      return
    }

    toast.success("Your research profile is ready.")
    window.location.replace(getRoleHome(user.role))
  }

  async function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile image must be 2 MB or smaller.")
      return
    }

    await startUpload([file])
  }

  return (
    <form className={cn("space-y-8", className)} onSubmit={form.handleSubmit(onSubmit)}>
      <ol className="grid grid-cols-4 gap-2" aria-label="Onboarding progress">
        {STEPS.map((item, index) => (
          <li key={item.title} className="space-y-2">
            <div
              className={cn(
                "h-1.5 rounded-full bg-muted transition-colors",
                index <= step && "bg-primary",
              )}
            />
            <span
              className={cn(
                "text-xs text-muted-foreground",
                index === step && "font-medium text-foreground",
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index + 1}. {item.title}
            </span>
          </li>
        ))}
      </ol>

      <div className="min-h-72">
        {step === 0 && (
          <FieldGroup>
            <div>
              <h2 className="text-xl font-semibold">Confirm your account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Make sure your name is how it should appear on submissions and feedback.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" autoComplete="name" {...form.register("name")} />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="profileImage">Profile image (optional)</FieldLabel>
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                <Avatar className="size-16">
                  {imageUrl ? <AvatarImage src={imageUrl} alt={`${values.name}'s profile`} /> : null}
                  <AvatarFallback className="text-lg">
                    {values.name?.trim().charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <label
                    htmlFor="profileImage"
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center gap-2 border border-input bg-background px-3 text-xs font-medium hover:bg-muted",
                      isUploading && "pointer-events-none opacity-50",
                    )}
                  >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    {isUploading ? "Uploading..." : imageUrl ? "Change image" : "Upload image"}
                  </label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={handleImageSelection}
                  />
                  <FieldDescription>PNG, JPEG, WebP, or GIF. Maximum 2 MB.</FieldDescription>
                </div>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input id="email" value={user.email} disabled />
              <FieldDescription>Your sign-in email cannot be changed here.</FieldDescription>
            </Field>
          </FieldGroup>
        )}

        {step === 1 && (
          <FieldGroup>
            <div>
              <h2 className="text-xl font-semibold">Academic details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These details connect you to the correct university workspace.
              </p>
            </div>
            <Field>
              <FieldLabel>Account role</FieldLabel>
              <Input value={formatRole(user.role)} disabled />
              <FieldDescription>Roles are assigned securely by your institution.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="department">Department</FieldLabel>
              <Select
                value={values.departmentId}
                onValueChange={(value) =>
                  form.setValue("departmentId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name} ({department.code}) — {department.institutionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.departmentId]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="institutionalNumber">
                {isStudent ? "Student number" : "Staff number"}
              </FieldLabel>
              <Input
                id="institutionalNumber"
                placeholder={isStudent ? "STU-2026-0001" : "STF-2026-101"}
                {...form.register(isStudent ? "studentNumber" : "staffNumber", {
                  required: isStudent ? "Student number is required." : "Staff number is required.",
                })}
              />
              <FieldError
                errors={[
                  isStudent
                    ? form.formState.errors.studentNumber
                    : form.formState.errors.staffNumber,
                ]}
              />
            </Field>
          </FieldGroup>
        )}

        {step === 2 && (
          <FieldGroup>
            <div>
              <h2 className="text-xl font-semibold">Research profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We use this to personalize discovery, AI suggestions, and collaboration matches.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="researchInterests">Research interests (optional)</FieldLabel>
              <Input
                id="researchInterests"
                placeholder="AI in education, health informatics, HCI"
                {...form.register("researchInterests")}
              />
              <FieldDescription>Separate up to 12 topics with commas.</FieldDescription>
              <FieldError errors={[form.formState.errors.researchInterests]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="bio">Short bio (optional)</FieldLabel>
              <Textarea
                id="bio"
                rows={5}
                placeholder="Describe your research background, goals, or supervision focus."
                {...form.register("bio")}
              />
              <div className="flex justify-between gap-4">
                <FieldError errors={[form.formState.errors.bio]} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {values.bio?.length ?? 0}/500
                </span>
              </div>
            </Field>
          </FieldGroup>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Review your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You can return to any step before creating your workspace.
              </p>
            </div>
            <dl className="grid gap-4 rounded-lg border bg-muted/30 p-5 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="font-medium">{values.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Role</dt><dd className="font-medium">{formatRole(user.role)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Department</dt><dd className="font-medium">{selectedDepartment?.name}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Institutional ID</dt><dd className="font-medium">{isStudent ? values.studentNumber : values.staffNumber}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Research interests</dt><dd className="font-medium">{values.researchInterests || "Not provided"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Bio</dt><dd className="text-sm">{values.bio || "Not provided"}</dd></div>
            </dl>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0 || isPending}
        >
          <ArrowLeft /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={isUploading}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending || isUploading}>
            {isPending ? <Loader2 className="animate-spin" /> : <UserCheck />}
            {isPending ? "Creating workspace..." : "Complete onboarding"}
          </Button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of {STEPS.length}: {STEPS[step].title}
      </p>
    </form>
  )
}
