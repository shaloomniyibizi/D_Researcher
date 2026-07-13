import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import { updateProfileImage } from "@/features/onboarding/repositories/profile-image-repository"
import { ingestKnowledgeDocument } from "@/features/knowledge-base/services/ingest-document"
import { auth } from "@/lib/auth"
import { UserRole } from "@/generated/prisma/client"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { importChapterFile } from "@/features/chapters/services/import-chapter-file"

const upload = createUploadthing()

export const uploadRouter = {
  chapterDocument: upload({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .input(z.object({ chapterId: z.string().cuid() }))
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers })
      if (!session || session.user.role !== UserRole.STUDENT) throw new UploadThingError("Unauthorized")
      return { userId: session.user.id, chapterId: input.chapterId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const result = await importChapterFile({ userId: metadata.userId, chapterId: metadata.chapterId, key: file.key, url: file.ufsUrl, name: file.name, size: file.size, mimeType: file.type })
      if (result.success) {
        revalidatePath(`/student/projects/${result.projectId}`)
        revalidatePath("/student")
        revalidatePath("/student/projects")
        revalidatePath("/supervisor")
      }
      return { imported: result.success }
    }),
  profileImage: upload({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers })

      if (!session) {
        throw new UploadThingError("Unauthorized")
      }

      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await updateProfileImage(metadata.userId, file.ufsUrl)

      return { imageUrl: file.ufsUrl }
    }),

  knowledgeDocument: upload({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers })

      if (!session || session.user.role !== UserRole.STUDENT) {
        throw new UploadThingError("Unauthorized")
      }

      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const result = await ingestKnowledgeDocument({
        userId: metadata.userId,
        key: file.key,
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
      })

      return { documentId: result.success ? result.documentId : null }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
