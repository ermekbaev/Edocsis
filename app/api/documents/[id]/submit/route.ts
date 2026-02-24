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

  // Parse optional approverId from request body
  let manualApproverId: string | undefined;
  try {
    const body = await req.json();
    manualApproverId = body.approverId;
  } catch {
    // No body or invalid JSON - that's fine, approverId is optional
  }

  // Find document with template and approval route
  const document = await prisma.document.findUnique({
    where: { id },
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
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify ownership
  if (document.initiatorId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify status
  if (document.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT documents can be submitted" },
      { status: 400 }
    );
  }

  // Check if template has approval route
  const approvalRoute = document.template.approvalRoute;
  if (!approvalRoute || approvalRoute.steps.length === 0) {
    // Use manually selected approver if provided
    let approver;

    if (manualApproverId) {
      approver = await prisma.user.findUnique({
        where: { id: manualApproverId },
      });

      if (!approver) {
        return NextResponse.json(
          { error: "Selected approver not found" },
          { status: 400 }
        );
      }

      if (approver.role !== "APPROVER" && approver.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Selected user is not an approver" },
          { status: 400 }
        );
      }
    } else {
      // Fallback: find first APPROVER
      approver = await prisma.user.findFirst({
        where: { role: "APPROVER" },
      });

      if (!approver) {
        return NextResponse.json(
          { error: "No approver available" },
          { status: 400 }
        );
      }
    }

    // Update document, create approval, log action, and notify approver
    const [updatedDocument] = await prisma.$transaction([
      prisma.document.update({
        where: { id },
        data: {
          status: "IN_APPROVAL",
          currentApproverId: approver.id,
          currentStepNumber: null,
        },
      }),
      prisma.approval.create({
        data: {
          documentId: id,
          approverId: approver.id,
          status: "PENDING",
          stepNumber: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "submitted",
          documentId: id,
          userId: auth.userId,
          metadata: { approverId: approver.id, approverName: approver.name },
        },
      }),
      prisma.notification.create({
        data: {
          type: "APPROVAL_REQUEST",
          message: `New document "${document.title}" (${document.number}) is waiting for your approval`,
          userId: approver.id,
        },
      }),
    ]);

    return NextResponse.json(updatedDocument);
  }

  // Multi-step approval route exists
  const firstStep = approvalRoute.steps[0];
  const approverIds = firstStep.approverIds as string[];

  if (!approverIds || approverIds.length === 0) {
    return NextResponse.json(
      { error: "No approvers configured for first step" },
      { status: 400 }
    );
  }

  // Get all approvers for the first step
  const approvers = await prisma.user.findMany({
    where: {
      id: { in: approverIds },
      role: { in: ["APPROVER", "ADMIN"] },
    },
  });

  if (approvers.length === 0) {
    return NextResponse.json(
      { error: "No valid approvers found for first step" },
      { status: 400 }
    );
  }

  // Select first approver as current approver (for display purposes)
  const currentApprover = approvers[0];

  // Create approval records for all approvers in this step
  const approvalCreates = approvers.map((approver) => ({
    documentId: id,
    approverId: approver.id,
    status: "PENDING" as const,
    stepNumber: firstStep.stepNumber,
  }));

  // Create notifications for all approvers
  const notificationCreates = approvers.map((approver) => ({
    type: "APPROVAL_REQUEST",
    message: `New document "${document.title}" (${document.number}) is waiting for your approval (Step ${firstStep.stepNumber}: ${firstStep.name})`,
    userId: approver.id,
  }));

  // Update document and create all approvals/notifications in transaction
  const [updatedDocument] = await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: {
        status: "IN_APPROVAL",
        currentApproverId: currentApprover.id,
        currentStepNumber: firstStep.stepNumber,
      },
    }),
    ...approvalCreates.map((data) => prisma.approval.create({ data })),
    prisma.auditLog.create({
      data: {
        action: "submitted",
        documentId: id,
        userId: auth.userId,
        metadata: {
          stepNumber: firstStep.stepNumber,
          stepName: firstStep.name,
          approverCount: approvers.length,
        },
      },
    }),
    ...notificationCreates.map((data) => prisma.notification.create({ data })),
  ]);

  return NextResponse.json(updatedDocument);
}
