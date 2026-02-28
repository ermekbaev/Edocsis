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
    // No body — fine, comment is optional
  }

  // Load document with approval route
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      template: {
        include: {
          approvalRoute: {
            include: {
              steps: { orderBy: { stepNumber: "asc" } },
            },
          },
        },
      },
    },
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

  // Find this user's pending approval record for the current step
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

  // Mark this approval as APPROVED
  await prisma.approval.update({
    where: { id: myApproval.id },
    data: {
      status: "APPROVED",
      comment: comment || null,
      decidedAt: new Date(),
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      action: "approved",
      documentId: id,
      userId: auth.userId,
      metadata: { comment, stepNumber: document.currentStepNumber },
    },
  });

  // --- Determine if this step is complete ---
  const isMultiStep = document.currentStepNumber !== null;

  if (isMultiStep) {
    const approvalRoute = document.template?.approvalRoute ?? null;
    const currentStep = approvalRoute?.steps.find(
      (s) => s.stepNumber === document.currentStepNumber
    );

    if (!currentStep) {
      return NextResponse.json(
        { error: "Current step not found in approval route" },
        { status: 500 }
      );
    }

    const requireAll = currentStep.requireAll;

    // Get all approval records for this step
    const stepApprovals = await prisma.approval.findMany({
      where: {
        documentId: id,
        stepNumber: document.currentStepNumber,
      },
    });

    const allApproved = stepApprovals.every((a) => a.status === "APPROVED");
    const anyApproved = stepApprovals.some((a) => a.status === "APPROVED");

    const stepComplete = requireAll ? allApproved : anyApproved;

    if (!stepComplete) {
      // Step not yet complete — just return updated document
      const updatedDocument = await prisma.document.findUnique({
        where: { id },
        include: {
          template: true,
          initiator: { select: { name: true } },
          currentApprover: { select: { name: true } },
        },
      });
      return NextResponse.json(updatedDocument);
    }

    // Step is complete — find next step
    const nextStep = approvalRoute?.steps.find(
      (s) => s.stepNumber > (document.currentStepNumber ?? 0)
    );

    if (nextStep) {
      // Advance to next step
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
          { status: 500 }
        );
      }

      const approvalCreates = nextApprovers.map((approver) => ({
        documentId: id,
        approverId: approver.id,
        status: "PENDING" as const,
        stepNumber: nextStep.stepNumber,
      }));

      const notificationCreates = nextApprovers.map((approver) => ({
        type: "APPROVAL_REQUEST",
        message: `Document "${document.title}" (${document.number}) is waiting for your approval (Step ${nextStep.stepNumber}: ${nextStep.name})`,
        userId: approver.id,
      }));

      const [updatedDocument] = await prisma.$transaction([
        prisma.document.update({
          where: { id },
          data: {
            currentApproverId: nextApprovers[0].id,
            currentStepNumber: nextStep.stepNumber,
          },
          include: {
            template: true,
            initiator: { select: { name: true } },
            currentApprover: { select: { name: true } },
          },
        }),
        ...approvalCreates.map((data) => prisma.approval.create({ data })),
        ...notificationCreates.map((data) =>
          prisma.notification.create({ data })
        ),
      ]);

      return NextResponse.json(updatedDocument);
    } else {
      // No next step — document fully approved
      const updatedDocument = await prisma.$transaction(async (tx) => {
        const doc = await tx.document.update({
          where: { id },
          data: {
            status: "APPROVED",
            currentApproverId: null,
            currentStepNumber: null,
          },
          include: {
            template: true,
            initiator: { select: { name: true } },
            currentApprover: { select: { name: true } },
          },
        });

        // Notify initiator
        await tx.notification.create({
          data: {
            type: "DOCUMENT_APPROVED",
            message: `Your document "${document.title}" (${document.number}) has been approved`,
            userId: document.initiatorId,
          },
        });

        await tx.auditLog.create({
          data: {
            action: "fully_approved",
            documentId: id,
            userId: auth.userId,
            metadata: {},
          },
        });

        return doc;
      });

      return NextResponse.json(updatedDocument);
    }
  } else {
    // Single-step (no approval route) — immediately approve document
    const updatedDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id },
        data: {
          status: "APPROVED",
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
          type: "DOCUMENT_APPROVED",
          message: `Your document "${document.title}" (${document.number}) has been approved`,
          userId: document.initiatorId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "fully_approved",
          documentId: id,
          userId: auth.userId,
          metadata: {},
        },
      });

      return doc;
    });

    return NextResponse.json(updatedDocument);
  }
}
