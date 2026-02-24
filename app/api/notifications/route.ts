import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Get all notifications for current user, ordered by newest first
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.userId },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limit to last 50 notifications
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Mark all notifications as read
  await prisma.notification.updateMany({
    where: {
      userId: auth.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ success: true });
}
