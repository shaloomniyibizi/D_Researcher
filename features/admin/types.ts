import type { UserRole, UserStatus } from "@/generated/prisma/client"
export type AdminProfile = { id: string; name: string; email: string; image: string | null; department: { id: string; name: string; institution: { id: string; name: string } } }
export type AdminUserRow = { id: string; name: string; email: string; image: string | null; role: UserRole; status: UserStatus; department: { name: string; code: string } | null; createdAt: Date; lastActiveAt: Date | null }
export type AdminActionResult = { success: true } | { success: false; error: string }
export type AdminDepartment = { id: string; name: string; code: string; headId: string | null; head: { id: string; name: string } | null; counts: { users: number; projects: number }; createdAt: Date }
export type DepartmentHeadOption = { id: string; name: string; role: UserRole }
