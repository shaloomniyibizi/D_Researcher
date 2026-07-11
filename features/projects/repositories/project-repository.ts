import prisma from "@/lib/prisma"

import type { CreateProjectInput, EditableStudentProject, StudentProjectDetails, StudentProjectSummary, SupervisorOption } from "../types"

async function getStudentDepartment(userId: string): Promise<string | null> {
  const student = await prisma.user.findFirst({
    where: { id: userId, role: "STUDENT", status: "ACTIVE", departmentId: { not: null } },
    select: { departmentId: true },
  })

  return student?.departmentId ?? null
}

export async function getStudentProjects(userId: string): Promise<StudentProjectSummary[] | null> {
  const departmentId = await getStudentDepartment(userId)
  if (!departmentId) return null

  const projects = await prisma.project.findMany({
    where: {
      departmentId,
      deletedAt: null,
      OR: [{ ownerId: userId }, { members: { some: { userId, joinedAt: { not: null } } } }],
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      abstract: true,
      status: true,
      visibility: true,
      keywords: true,
      updatedAt: true,
      supervisor: { select: { name: true, image: true } },
      milestones: {
        where: { status: { not: "APPROVED" } },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { id: true, title: true, status: true, dueAt: true },
      },
      _count: { select: { tasks: true, documents: true, sources: true, members: true } },
    },
  })

  return projects.map(({ milestones, _count, ...project }) => ({
    ...project,
    nextMilestone: milestones[0] ?? null,
    counts: _count,
  }))
}

export async function getStudentProjectDetails(
  userId: string,
  projectId: string,
): Promise<StudentProjectDetails | null> {
  const departmentId = await getStudentDepartment(userId)
  if (!departmentId) return null

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      departmentId,
      deletedAt: null,
      OR: [{ ownerId: userId }, { members: { some: { userId, joinedAt: { not: null } } } }],
    },
    select: {
      id: true,
      title: true,
      abstract: true,
      problemStatement: true,
      objectives: true,
      keywords: true,
      status: true,
      visibility: true,
      startedAt: true,
      updatedAt: true,
      department: { select: { name: true, code: true, institution: { select: { name: true } } } },
      owner: { select: { id: true, name: true, image: true } },
      supervisor: { select: { id: true, name: true, email: true, image: true } },
      members: {
        where: { joinedAt: { not: null } },
        orderBy: { joinedAt: "asc" },
        take: 20,
        select: { id: true, role: true, user: { select: { id: true, name: true, image: true } } },
      },
      milestones: {
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        take: 20,
        select: { id: true, title: true, description: true, status: true, dueAt: true },
      },
      tasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
        take: 10,
        select: { id: true, title: true, status: true, priority: true, dueAt: true },
      },
      _count: { select: { documents: true, sources: true, submissions: true, feedback: true } },
    },
  })

  if (!project) return null
  const { _count, ...details } = project
  return { ...details, counts: _count }
}

function createSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
}

export async function getAvailableSupervisors(
  userId: string,
): Promise<SupervisorOption[] | null> {
  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "STUDENT",
      status: "ACTIVE",
      onboardingCompletedAt: { not: null },
      departmentId: { not: null },
    },
    select: { departmentId: true },
  })

  if (!student?.departmentId) return null

  return prisma.user.findMany({
    where: {
      departmentId: student.departmentId,
      role: "SUPERVISOR",
      status: "ACTIVE",
    },
    orderBy: { name: "asc" },
    take: 100,
    select: { id: true, name: true, email: true, image: true },
  })
}

export async function getStudentProjectForEdit(
  userId: string,
  projectId: string,
): Promise<EditableStudentProject | null> {
  const departmentId = await getStudentDepartment(userId)
  if (!departmentId) return null

  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
      departmentId,
      deletedAt: null,
      status: { notIn: ["DEFENDED", "ARCHIVED"] },
    },
    select: {
      id: true,
      title: true,
      abstract: true,
      problemStatement: true,
      objectives: true,
      keywords: true,
      visibility: true,
      supervisorId: true,
    },
  })
}

export async function updateStudentProject(
  userId: string,
  projectId: string,
  input: CreateProjectInput,
): Promise<
  | { success: true; projectId: string }
  | { success: false; reason: "PROJECT_NOT_FOUND" | "INVALID_SUPERVISOR" }
> {
  return prisma.$transaction(async (db) => {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
        deletedAt: null,
        status: { notIn: ["DEFENDED", "ARCHIVED"] },
        department: { users: { some: { id: userId, role: "STUDENT", status: "ACTIVE" } } },
      },
      select: {
        id: true, departmentId: true, title: true, slug: true, abstract: true,
        problemStatement: true, objectives: true, keywords: true,
        visibility: true, supervisorId: true,
      },
    })

    if (!project) return { success: false, reason: "PROJECT_NOT_FOUND" as const }

    if (input.supervisorId) {
      const supervisor = await db.user.findFirst({
        where: {
          id: input.supervisorId,
          departmentId: project.departmentId,
          role: "SUPERVISOR",
          status: "ACTIVE",
        },
        select: { id: true },
      })

      if (!supervisor) return { success: false, reason: "INVALID_SUPERVISOR" as const }
    }

    let slug = project.slug
    if (input.title !== project.title) {
      const baseSlug = createSlug(input.title) || "research-project"
      const existing = await db.project.findMany({
        where: { departmentId: project.departmentId, id: { not: project.id }, slug: { startsWith: baseSlug } },
        take: 100,
        select: { slug: true },
      })
      const usedSlugs = new Set(existing.map((item) => item.slug))
      slug = baseSlug
      let suffix = 2
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`
        suffix += 1
      }
    }

    await db.project.update({
      where: { id: project.id },
      data: {
        title: input.title,
        slug,
        abstract: input.abstract,
        problemStatement: input.problemStatement,
        objectives: input.objectives,
        keywords: input.keywords,
        visibility: input.visibility,
        supervisorId: input.supervisorId,
      },
      select: { id: true },
    })

    const changes = [
      { field: "title", before: project.title, after: input.title },
      { field: "abstract", before: project.abstract, after: input.abstract },
      { field: "problemStatement", before: project.problemStatement, after: input.problemStatement },
      { field: "objectives", before: project.objectives, after: input.objectives },
      { field: "keywords", before: project.keywords, after: input.keywords },
      { field: "visibility", before: project.visibility, after: input.visibility },
      { field: "supervisor", before: project.supervisorId, after: input.supervisorId },
    ].filter((change) => JSON.stringify(change.before) !== JSON.stringify(change.after))

    if (changes.length > 0) await db.activityLog.create({
      data: {
        actorId: userId,
        departmentId: project.departmentId,
        projectId: project.id,
        action: "project.updated",
        entityType: "Project",
        entityId: project.id,
        metadata: { changes },
      },
    })

    if (changes.length > 0 && input.supervisorId) await db.notification.create({
      data: {
        userId: input.supervisorId,
        departmentId: project.departmentId,
        channel: "IN_APP",
        title: "Student updated a project",
        body: `${input.title} has new changes ready for review.`,
        actionUrl: `/supervisor/projects/${project.id}`,
      },
    })

    return { success: true, projectId: project.id }
  })
}

export async function createStudentProject(
  userId: string,
  input: CreateProjectInput,
): Promise<
  | { success: true; projectId: string }
  | { success: false; reason: "STUDENT_NOT_FOUND" | "INVALID_SUPERVISOR" }
> {
  return prisma.$transaction(async (db) => {
    const student = await db.user.findFirst({
      where: {
        id: userId,
        role: "STUDENT",
        status: "ACTIVE",
        onboardingCompletedAt: { not: null },
        departmentId: { not: null },
      },
      select: { departmentId: true },
    })

    if (!student?.departmentId) {
      return { success: false, reason: "STUDENT_NOT_FOUND" as const }
    }

    if (input.supervisorId) {
      const supervisor = await db.user.findFirst({
        where: {
          id: input.supervisorId,
          departmentId: student.departmentId,
          role: "SUPERVISOR",
          status: "ACTIVE",
        },
        select: { id: true },
      })

      if (!supervisor) {
        return { success: false, reason: "INVALID_SUPERVISOR" as const }
      }
    }

    const baseSlug = createSlug(input.title) || "research-project"
    const existingProjects = await db.project.findMany({
      where: {
        departmentId: student.departmentId,
        slug: { startsWith: baseSlug },
      },
      take: 100,
      select: { slug: true },
    })
    const usedSlugs = new Set(existingProjects.map((project) => project.slug))
    let slug = baseSlug
    let suffix = 2

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    const project = await db.project.create({
      data: {
        departmentId: student.departmentId,
        ownerId: userId,
        supervisorId: input.supervisorId,
        title: input.title,
        slug,
        abstract: input.abstract,
        problemStatement: input.problemStatement,
        objectives: input.objectives,
        keywords: input.keywords,
        visibility: input.visibility,
        status: "IDEA",
        startedAt: new Date(),
        milestones: {
          create: {
            createdById: userId,
            title: "Complete idea brief",
            description: "Define the research problem, scope, objectives, and expected contribution.",
            type: "IDEA_BRIEF",
            status: "IN_PROGRESS",
          },
        },
      },
      select: { id: true },
    })

    await db.activityLog.create({
      data: {
        actorId: userId,
        departmentId: student.departmentId,
        projectId: project.id,
        action: "project.created",
        entityType: "Project",
        entityId: project.id,
        metadata: { title: input.title },
      },
    })

    return { success: true, projectId: project.id }
  })
}
