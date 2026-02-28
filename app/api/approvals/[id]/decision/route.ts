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

  // Parse body
  let action: string, comment: string | undefined;
  try {
    ({ action, comment } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate action
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  // Find approval with document and template route
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      document: {
        include: {
          template: {
            include: {
              approvalRoute: {
                include: {
                  steps: {
                    orderBy: {
                      stepNumber: "asc",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  // Get current user to check role
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  // Verify ownership (or ADMIN can approve any document)
  if (approval.approverId !== auth.userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify status
  if (approval.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only PENDING approvals can be decided" },
      { status: 400 }
    );
  }

  const document = approval.document;
  const approvalRoute = document.template?.approvalRoute ?? null;

  // If rejection, set document to REJECTED immediately
  if (action === "reject") {
    const [, updatedDocument] = await prisma.$transaction([
      prisma.approval.update({
        where: { id },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          comment,
        },
      }),
      prisma.document.update({
        where: { id: document.id },
        data: {
          status: "REJECTED",
          currentApproverId: null,
          currentStepNumber: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "rejected",
          documentId: document.id,
          userId: auth.userId,
          metadata: {
            ...(comment && { comment }),
            stepNumber: approval.stepNumber,
          },
        },
      }),
      prisma.notification.create({
        data: {
          type: "DOCUMENT_REJECTED",
          message: `Your document "${document.title}" (${document.number}) has been rejected${comment ? `: ${comment}` : ""}`,
          userId: document.initiatorId,
        },
      }),
    ]);

    return NextResponse.json(updatedDocument);
  }

  // Handle approval
  // Mark this approval as APPROVED
  await prisma.approval.update({
    where: { id },
    data: {
      status: "APPROVED",
      decidedAt: new Date(),
      comment,
    },
  });

  // If no approval route (old single-step approval)
  if (!approvalRoute || !approval.stepNumber) {
    const [, updatedDocument] = await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          action: "approved",
          documentId: document.id,
          userId: auth.userId,
          ...(comment && { metadata: { comment } }),
        },
      }),
      prisma.document.update({
        where: { id: document.id },
        data: {
          status: "APPROVED",
          currentApproverId: null,
          currentStepNumber: null,
        },
      }),
      prisma.notification.create({
        data: {
          type: "DOCUMENT_APPROVED",
          message: `Your document "${document.title}" (${document.number}) has been approved`,
          userId: document.initiatorId,
        },
      }),
    ]);

    return NextResponse.json(updatedDocument);
  }

  // Multi-step approval route
  const currentStep = approvalRoute.steps.find((s) => s.stepNumber === approval.stepNumber);
  if (!currentStep) {
    return NextResponse.json({ error: "Current step not found" }, { status: 500 });
  }

  // Check if all approvals for current step are completed
  const allApprovalsForStep = await prisma.approval.findMany({
    where: {
      documentId: document.id,
      stepNumber: approval.stepNumber,
    },
  });

  const allApproved = allApprovalsForStep.every((a) => a.status === "APPROVED");
  const anyRejected = allApprovalsForStep.some((a) => a.status === "REJECTED");

  // If requireAll is true, wait for all approvals
  if (currentStep.requireAll && !allApproved) {
    // Not all approvals are done yet, just return current state
    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id },
    });
    return NextResponse.json(updatedDocument);
  }

  // If requireAll is false, one approval is enough
  // If anyRejected, document is rejected (already handled above)
  if (anyRejected) {
    return NextResponse.json({ error: "Document already rejected" }, { status: 400 });
  }

  // Move to next step or complete
  const nextStep = approvalRoute.steps.find((s) => s.stepNumber === approval.stepNumber! + 1);

  if (!nextStep) {
    // This was the last step, approve document
    const [, updatedDocument] = await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          action: "approved",
          documentId: document.id,
          userId: auth.userId,
          metadata: {
            ...(comment && { comment }),
            stepNumber: approval.stepNumber,
            finalStep: true,
          },
        },
      }),
      prisma.document.update({
        where: { id: document.id },
        data: {
          status: "APPROVED",
          currentApproverId: null,
          currentStepNumber: null,
        },
      }),
      prisma.notification.create({
        data: {
          type: "DOCUMENT_APPROVED",
          message: `Your document "${document.title}" (${document.number}) has been approved`,
          userId: document.initiatorId,
        },
      }),
    ]);

    return NextResponse.json(updatedDocument);
  }

  // Move to next step
  const nextApproverIds = nextStep.approverIds as string[];
  const nextApprovers = await prisma.user.findMany({
    where: {
      id: { in: nextApproverIds },
      role: { in: ["APPROVER", "ADMIN"] },
    },
  });

  if (nextApprovers.length === 0) {
    return NextResponse.json(
      { error: "No valid approvers found for next step" },
      { status: 400 }
    );
  }

  const currentApprover = nextApprovers[0];

  // Create approval records for next step
  const approvalCreates = nextApprovers.map((approver) => ({
    documentId: document.id,
    approverId: approver.id,
    status: "PENDING" as const,
    stepNumber: nextStep.stepNumber,
  }));

  // Create notifications for next step approvers
  const notificationCreates = nextApprovers.map((approver) => ({
    type: "APPROVAL_REQUEST",
    message: `Document "${document.title}" (${document.number}) is waiting for your approval (Step ${nextStep.stepNumber}: ${nextStep.name})`,
    userId: approver.id,
  }));

  const [, updatedDocument] = await prisma.$transaction([
    ...approvalCreates.map((data) => prisma.approval.create({ data })),
    prisma.document.update({
      where: { id: document.id },
      data: {
        currentApproverId: currentApprover.id,
        currentStepNumber: nextStep.stepNumber,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: "approved",
        documentId: document.id,
        userId: auth.userId,
        metadata: {
          ...(comment && { comment }),
          stepNumber: approval.stepNumber,
          nextStepNumber: nextStep.stepNumber,
          nextStepName: nextStep.name,
        },
      },
    }),
    ...notificationCreates.map((data) => prisma.notification.create({ data })),
  ]);

  return NextResponse.json(updatedDocument);
}
