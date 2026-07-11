import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { markAllNotificationsRead, markNotificationRead } from "../actions";
import type { NotificationItem } from "../types";

function date(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}
export function NotificationCenter({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const unread = notifications.filter(
    (item) => item.status === "UNREAD",
  ).length;
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Project updates, feedback, and research activity.
          </p>
        </div>
        {unread > 0 ? (
          <form
            action={async () => {
              "use server";
              await markAllNotificationsRead();
            }}
          >
            <Button variant="outline" size="sm">
              <CheckCheck />
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent updates</CardTitle>
          <CardDescription>
            {unread} unread notification{unread === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {notifications.length === 0 ? (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <Bell className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  New research activity will appear here.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((item) => (
              <article
                key={item.id}
                className={`flex gap-3 p-4 sm:p-5 ${item.status === "UNREAD" ? "bg-primary/5" : ""}`}
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${item.status === "UNREAD" ? "bg-primary" : "bg-muted"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-xs font-semibold">{item.title}</p>
                    <time className="text-[10px] text-muted-foreground">
                      {date(item.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {item.actionUrl ? (
                      <Button size="sm" asChild>
                        <Link href={item.actionUrl}>View</Link>
                      </Button>
                    ) : null}
                    {item.status === "UNREAD" ? (
                      <form
                        action={async () => {
                          "use server";
                          await markNotificationRead({
                            notificationId: item.id,
                          });
                        }}
                      >
                        <Button variant="ghost" size="sm">
                          Mark read
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
