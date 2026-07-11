import prisma from "@/lib/prisma";
import type { ProjectChange, SupervisorProjectReview } from "../types";

function parseChanges(metadata: unknown): ProjectChange[] {
  if (!metadata || typeof metadata !== "object" || !("changes" in metadata))
    return [];
  const changes = (metadata as { changes?: unknown }).changes;
  if (!Array.isArray(changes)) return [];
  return changes.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("field" in item) ||
      typeof item.field !== "string"
    )
      return [];
    const value = item as { field: string; before?: unknown; after?: unknown };
    return [{ field: value.field, before: value.before, after: value.after }];
  });
}

export async function getSupervisorProjectReview(
  supervisorId: string,
  projectId: string,
): Promise<SupervisorProjectReview | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      supervisorId,
      deletedAt: null,
      supervisor: { role: "SUPERVISOR", status: "ACTIVE" },
    },
    select: {
      id: true,
      title: true,
      abstract: true,
      problemStatement: true,
      objectives: true,
      keywords: true,
      status: true,
      owner: { select: { name: true, image: true, studentNumber: true } },
      activityLogs: {
        where: { action: { in: ["project.created", "project.updated"] } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          action: true,
          metadata: true,
          createdAt: true,
          actor: { select: { name: true, image: true } },
          feedback: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              body: true,
              createdAt: true,
              author: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  });
  if (!project) return null;
  const { activityLogs, ...details } = project;
  return {
    project: details,
    activity: activityLogs.map(({ metadata, ...activity }) => ({
      ...activity,
      changes: parseChanges(metadata),
    })),
  };
}

export async function addSupervisorChangeFeedback(input: {
  supervisorId: string;
  projectId: string;
  activityLogId: string;
  body: string;
}): Promise<boolean> {
  return prisma.$transaction(async (db) => {
    const activity = await db.activityLog.findFirst({
      where: {
        id: input.activityLogId,
        projectId: input.projectId,
        project: { supervisorId: input.supervisorId, deletedAt: null },
      },
      select: {
        id: true,
        projectId: true,
        project: { select: { ownerId: true, departmentId: true, title: true } },
      },
    });
    if (!activity?.projectId || !activity.project) return false;
    await db.feedback.create({
      data: {
        projectId: activity.projectId,
        activityLogId: activity.id,
        authorId: input.supervisorId,
        body: input.body,
      },
    });
    await db.notification.create({
      data: {
        userId: activity.project.ownerId,
        departmentId: activity.project.departmentId,
        channel: "IN_APP",
        title: "New supervisor feedback",
        body: `Your supervisor left feedback on ${activity.project.title}.`,
        actionUrl: "/student/feedback",
      },
    });
    await db.activityLog.create({
      data: {
        actorId: input.supervisorId,
        projectId: activity.projectId,
        action: "feedback.created",
        entityType: "ActivityLog",
        entityId: activity.id,
      },
    });
    return true;
  });
}
