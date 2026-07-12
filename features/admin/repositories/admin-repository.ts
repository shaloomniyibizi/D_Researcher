import type { UserRole, UserStatus } from "@/generated/prisma/client"
import prisma from "@/lib/prisma"

export async function getAdminProfile(userId: string) {
  const profile = await prisma.user.findFirst({ where: { id: userId, role: "ADMIN", status: "ACTIVE", department: { isNot: null } }, select: { id: true, name: true, email: true, image: true, department: { select: { id: true, name: true, institution: { select: { id: true, name: true } } } } } })
  if (!profile?.department) return null
  return { ...profile, department: profile.department }
}
export async function getAdminDashboard(userId: string) {
  const profile = await getAdminProfile(userId); if (!profile) return null; const institutionId = profile.department.institution.id
  const [users, projects, departments, repositoryRecords, activeUsers, roleGroups, statusGroups, recentUsers] = await Promise.all([
    prisma.user.count({ where: { department: { institutionId } } }), prisma.project.count({ where: { department: { institutionId }, deletedAt: null } }), prisma.department.count({ where: { institutionId } }), prisma.repositoryRecord.count({ where: { institutionId } }), prisma.user.count({ where: { department: { institutionId }, status: "ACTIVE" } }), prisma.user.groupBy({ by: ["role"], where: { department: { institutionId } }, _count: { _all: true } }), prisma.user.groupBy({ by: ["status"], where: { department: { institutionId } }, _count: { _all: true } }), prisma.user.findMany({ where: { department: { institutionId } }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, email: true, role: true, status: true, createdAt: true } })])
  return { profile, metrics: { users, projects, departments, repositoryRecords, activeUsers }, usersByRole: Object.fromEntries(roleGroups.map((item) => [item.role, item._count._all])), usersByStatus: Object.fromEntries(statusGroups.map((item) => [item.status, item._count._all])), recentUsers }
}
export async function getAdminUsers(userId: string, input: { query?: string; role?: UserRole; status?: UserStatus; page: number }) {
  const profile = await getAdminProfile(userId); if (!profile) return null; const institutionId = profile.department.institution.id; const where = { department: { institutionId }, ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}), ...(input.query ? { OR: [{ name: { contains: input.query, mode: "insensitive" as const } }, { email: { contains: input.query, mode: "insensitive" as const } }] } : {}) }; const pageSize = 20
  const [users, total] = await Promise.all([prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * pageSize, take: pageSize, select: { id: true, name: true, email: true, image: true, role: true, status: true, department: { select: { name: true, code: true } }, createdAt: true, lastActiveAt: true } }), prisma.user.count({ where })]); return { profile, users, total, page: input.page, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}
export async function updateInstitutionUser(adminId: string, targetId: string, role: UserRole, status: UserStatus) {
  if (adminId === targetId && (role !== "ADMIN" || status !== "ACTIVE")) return "SELF_LOCKOUT" as const
  const admin = await getAdminProfile(adminId); if (!admin) return "NOT_FOUND" as const
  const target = await prisma.user.findFirst({ where: { id: targetId, department: { institutionId: admin.department.institution.id } }, select: { id: true, departmentId: true } }); if (!target) return "NOT_FOUND" as const
  await prisma.$transaction([prisma.user.update({ where: { id: target.id }, data: { role, status } }), prisma.activityLog.create({ data: { actorId: adminId, departmentId: target.departmentId, action: "admin.user.updated", entityType: "User", entityId: target.id, metadata: { role, status } } })]); return "UPDATED" as const
}

export async function getAdminDepartments(userId: string) {
  const profile = await getAdminProfile(userId); if (!profile) return null; const institutionId = profile.department.institution.id
  const [departments, headOptions] = await Promise.all([
    prisma.department.findMany({ where: { institutionId }, orderBy: { name: "asc" }, take: 200, select: { id: true, name: true, code: true, headId: true, createdAt: true, head: { select: { id: true, name: true } }, _count: { select: { users: true, projects: true } } } }),
    prisma.user.findMany({ where: { department: { institutionId }, role: { in: ["SUPERVISOR", "ADMIN"] }, status: "ACTIVE" }, orderBy: { name: "asc" }, take: 300, select: { id: true, name: true, role: true } }),
  ])
  return { profile, departments: departments.map(({ _count, ...department }) => ({ ...department, counts: _count })), headOptions }
}

export async function saveInstitutionDepartment(input: { adminId: string; departmentId: string | null; name: string; code: string; headId: string | null }) {
  const admin = await getAdminProfile(input.adminId); if (!admin) return "NOT_FOUND" as const; const institutionId = admin.department.institution.id
  if (input.headId) { const head = await prisma.user.findFirst({ where: { id: input.headId, department: { institutionId }, role: { in: ["SUPERVISOR", "ADMIN"] }, status: "ACTIVE" }, select: { id: true } }); if (!head) return "INVALID_HEAD" as const }
  const duplicate = await prisma.department.findFirst({ where: { institutionId, code: input.code, ...(input.departmentId ? { id: { not: input.departmentId } } : {}) }, select: { id: true } }); if (duplicate) return "DUPLICATE_CODE" as const
  const department = input.departmentId ? await prisma.department.updateMany({ where: { id: input.departmentId, institutionId }, data: { name: input.name, code: input.code, headId: input.headId } }).then((result) => result.count ? { id: input.departmentId as string } : null) : await prisma.department.create({ data: { institutionId, name: input.name, code: input.code, headId: input.headId }, select: { id: true } })
  if (!department) return "NOT_FOUND" as const
  await prisma.activityLog.create({ data: { actorId: input.adminId, departmentId: department.id, action: input.departmentId ? "admin.department.updated" : "admin.department.created", entityType: "Department", entityId: department.id, metadata: { name: input.name, code: input.code, headId: input.headId } } })
  return "SAVED" as const
}
