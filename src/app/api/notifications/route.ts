import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { NotificationsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  return NextResponse.json({ notifications: NotificationsRepo.listNotifications(userId), unreadCount: NotificationsRepo.unreadCount(userId) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (body.action === "mark-read") {
    NotificationsRepo.markNotificationRead(userId, body.id);
    return NextResponse.json({ success: true });
  }
  if (body.action === "mark-all-read") {
    NotificationsRepo.markAllNotificationsRead(userId);
    return NextResponse.json({ success: true });
  }
  const notif = NotificationsRepo.createNotification(userId, body);
  return NextResponse.json({ notification: notif }, { status: 201 });
});
