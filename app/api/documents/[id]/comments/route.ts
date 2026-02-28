import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Get comments for this document
  const comments = await prisma.comment.findMany({
    where: { documentId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let text: string;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text || text.trim().length === 0) {
    return NextResponse.json(
      { error: "text is required and cannot be empty" },
      { status: 400 }
    );
  }

  // Check if document exists and load approvals to verify commenter's access
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      number: true,
      initiatorId: true,
      approvals: {
        select: { approverId: true },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Role-based comment access:
  // - ADMIN: always allowed
  // - INITIATOR / USER: only their own documents
  // - APPROVER: only documents they are/were assigned to approve
  const isAdmin     = auth.role === "ADMIN";
  const isInitiator = document.initiatorId === auth.userId;
  const isApprover  = document.approvals.some((a) => a.approverId === auth.userId);

  if (!isAdmin && !isInitiator && !isApprover) {
    return NextResponse.json(
      { error: "You do not have permission to comment on this document" },
      { status: 403 }
    );
  }

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      text: text.trim(),
      documentId: id,
      userId: auth.userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Notify initiator if someone else commented
  if (document.initiatorId !== auth.userId) {
    await prisma.notification.create({
      data: {
        type: "NEW_COMMENT",
        message: `${comment.user.name} commented on your document "${document.title}" (${document.number})`,
        userId: document.initiatorId,
      },
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
