import { auth } from "@/lib/auth"

const TRANSIENT_DATABASE_ERRORS = [
  "P1001",
  "P1017",
  "server has closed the connection",
  "connection terminated unexpectedly",
  "ECONNRESET",
  "ETIMEDOUT",
] as const

function isTransientDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = `${error.name} ${error.message}`.toLowerCase()
  return TRANSIENT_DATABASE_ERRORS.some((value) => message.includes(value.toLowerCase()))
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function getServerSession(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({ headers: requestHeaders })
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error

    await delay(250)
    return auth.api.getSession({ headers: requestHeaders })
  }
}
