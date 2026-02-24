import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Get notification to verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  if (notification.userId !== auth.userId) {
    return NextResponse.json(
      { error: "You don't have permission to update this notification" },
      { status: 403 }
    );
  }

  // Mark as read
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Get notification to verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  if (notification.userId !== auth.userId) {
    return NextResponse.json(
      { error: "You don't have permission to delete this notification" },
      { status: 403 }
    );
  }

  // Delete notification
  await prisma.notification.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
