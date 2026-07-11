import {
  CalendarClock,
  FileCheck2,
  FolderKanban,
  MessageCircle,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSupervisorDashboardData } from "@/features/supervisor-dashboard/repositories/supervisor-dashboard-repository";
import { UserRole } from "@/generated/prisma/client";
import { getServerSession } from "@/lib/server-session";

export const metadata: Metadata = {
  title: "Supervisor Dashboard | Researcher",
  description: "Monitor supervisees, submissions, milestones, and meetings.",
};

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
function date(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function SupervisorDashboardPage() {
  const session = await getServerSession(await headers());
  if (!session) redirect("/auth?mode=sign-in");
  if (session.user.role !== UserRole.SUPERVISOR) notFound();
  const data = await getSupervisorDashboardData(session.user.id);
  if (!data) notFound();

  const overdue = data.projects.filter(
    (project) =>
      project.nextMilestone?.dueAt && project.nextMilestone.dueAt < new Date(),
  ).length;
  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-primary">
            {data.profile.department?.name}
          </p>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Welcome, {data.profile.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your students and keep research work moving.
          </p>
        </div>
        <Button asChild>
          <Link href="/supervisor/chat">
            <MessageCircle />
            Open project chat
          </Link>
        </Button>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            name: "Supervised projects",
            value: data.projects.length,
            detail: `${new Set(data.projects.map((project) => project.owner.name)).size} students`,
            icon: FolderKanban,
          },
          {
            name: "Pending reviews",
            value: data.submissions.length,
            detail: "Submitted or under review",
            icon: FileCheck2,
          },
          {
            name: "Upcoming meetings",
            value: data.meetings.length,
            detail: data.meetings[0]
              ? date(data.meetings[0].startsAt)
              : "Nothing scheduled",
            icon: CalendarClock,
          },
          {
            name: "Needs attention",
            value: overdue,
            detail: `${data.unreadNotifications} unread updates`,
            icon: Users,
          },
        ].map((metric) => (
          <Card key={metric.name} size="sm">
            <CardHeader>
              <CardDescription>{metric.name}</CardDescription>
              <CardAction className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                <metric.icon className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-semibold">
                {metric.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {metric.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Supervised research</CardTitle>
              <CardDescription>
                Student progress and the next milestone requiring attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.projects.length === 0 ? (
                <div className="grid min-h-64 place-items-center text-center">
                  <div>
                    <FolderKanban className="mx-auto size-7 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      No assigned projects
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Assigned student projects will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                data.projects.map((project) => (
                  <article key={project.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        {project.owner.image ? (
                          <AvatarImage
                            src={project.owner.image}
                            alt={project.owner.name}
                          />
                        ) : null}
                        <AvatarFallback>{project.owner.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                              href={`/supervisor/projects/${project.id}`}
                            className="truncate text-sm font-semibold hover:text-primary"
                          >
                            {project.title}
                          </Link>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            {label(project.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {project.owner.name}
                          {project.owner.studentNumber
                            ? ` · ${project.owner.studentNumber}`
                            : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                          <span>{project.counts.documents} documents</span>
                          <span>{project.counts.submissions} submissions</span>
                          <span>{project.counts.tasks} tasks</span>
                        </div>
                        {project.nextMilestone ? (
                          <p className="mt-3 rounded-md border border-dashed p-2 text-[11px]">
                            <span className="font-medium">
                              Next: {project.nextMilestone.title}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              {project.nextMilestone.dueAt
                                ? date(project.nextMilestone.dueAt)
                                : label(project.nextMilestone.status)}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                          <Link href={`/supervisor/projects/${project.id}`}>
                            Review changes
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Submissions awaiting review</CardTitle>
              <CardDescription>
                Recent work submitted by your students.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.submissions.length === 0 ? (
                <p className="p-8 text-center text-xs text-muted-foreground">
                  No submissions are waiting for review.
                </p>
              ) : (
                data.submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <Avatar size="sm">
                      {submission.submittedBy.image ? (
                        <AvatarImage
                          src={submission.submittedBy.image}
                          alt={submission.submittedBy.name}
                        />
                      ) : null}
                      <AvatarFallback>
                        {submission.submittedBy.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {submission.title}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {submission.submittedBy.name} ·{" "}
                        {submission.project.title}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px]">
                      {label(submission.status)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <aside>
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Upcoming meetings</CardTitle>
              <CardDescription>Your supervision schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {data.meetings.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarClock className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    No meetings scheduled.
                  </p>
                </div>
              ) : (
                data.meetings.map((meeting) => (
                  <div key={meeting.id} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <CalendarClock className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {meeting.title}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {meeting.project.owner.name} · {meeting.project.title}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-primary">
                        {date(meeting.startsAt)}
                      </p>
                    </div>
                    {meeting.meetingUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={meeting.meetingUrl}>Join</a>
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
