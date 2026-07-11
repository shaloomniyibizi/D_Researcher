export type NotificationItem = { id: string; title: string; body: string; actionUrl: string | null; status: "UNREAD" | "READ" | "ARCHIVED"; createdAt: Date }
export type NotificationActionResult = { success: true } | { success: false; error: string }
