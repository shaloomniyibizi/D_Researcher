import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import { updateProfileImage } from "@/features/onboarding/repositories/profile-image-repository"
import { auth } from "@/lib/auth"

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
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
