import prisma from "@/lib/prisma"

export async function updateProfileImage(userId: string, imageUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { image: imageUrl },
    select: { id: true },
  })
}
