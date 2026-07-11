import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import { updateProfileImage } from "@/features/onboarding/repositories/profile-image-repository"
import { ingestKnowledgeDocument } from "@/features/knowledge-base/services/ingest-document"
import { auth } from "@/lib/auth"
import { UserRole } from "@/generated/prisma/client"

const upload = createUploadthing()

export const uploadRouter = {
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
