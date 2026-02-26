import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let comment: string | undefined;
  try {
    const body = await req.json();
    comment = body.comment;
  } catch {
    // No body — fine
  }

  // Load document
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status !== "IN_APPROVAL") {
    return NextResponse.json(
      { error: "Document is not in approval" },
      { status: 400 }
    );
  }

  // Find this user's pending approval for the current step
  const myApproval = await prisma.approval.findFirst({
    where: {
      documentId: id,
      approverId: auth.userId,
      status: "PENDING",
      stepNumber: document.currentStepNumber ?? null,
    },
  });

  if (!myApproval) {
    return NextResponse.json(
      { error: "You are not an approver for this document at the current step" },
      { status: 403 }
    );
  }

  // Reject in a transaction: mark approval, mark document, notify initiator
  const updatedDocument = await prisma.$transaction(async (tx) => {
    await tx.approval.update({
      where: { id: myApproval.id },
      data: {
        status: "REJECTED",
        comment: comment || null,
        decidedAt: new Date(),
      },
    });

    const doc = await tx.document.update({
      where: { id },
      data: {
        status: "REJECTED",
        currentApproverId: null,
        currentStepNumber: null,
      },
      include: {
        template: true,
        initiator: { select: { name: true } },
        currentApprover: { select: { name: true } },
      },
    });

    await tx.notification.create({
      data: {
        type: "DOCUMENT_REJECTED",
        message: `Your document "${document.title}" (${document.number}) was rejected${comment ? `: ${comment}` : ""}`,
        userId: document.initiatorId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "rejected",
        documentId: id,
        userId: auth.userId,
        metadata: { comment, stepNumber: document.currentStepNumber },
      },
    });

    return doc;
  });

  return NextResponse.json(updatedDocument);
}
