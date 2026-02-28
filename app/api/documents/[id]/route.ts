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
      initiator: {
        select: {
          name: true,
        },
      },
      currentApprover: {
        select: {
          name: true,
        },
      },
      approvals: {
        select: {
          approverId: true,
          status: true,
          stepNumber: true,
          comment: true,
          decidedAt: true,
          approver: { select: { name: true } },
        },
      },
      files: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          path: true,
          size: true,
          mimeType: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let title: string | undefined, templateId: string | undefined, fieldValues: any;
  try {
    ({ title, templateId, fieldValues } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Find document
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Check: only initiator or ADMIN can edit
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (document.initiatorId !== auth.userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check: only DRAFT documents can be edited
  if (document.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT documents can be edited" },
      { status: 400 }
    );
  }

  // Build update data
  const data: { title?: string; templateId?: string; fieldValues?: any } = {};
  if (title !== undefined) {
    if (title.trim().length === 0) {
      return NextResponse.json(
        { error: "title cannot be empty" },
        { status: 400 }
      );
    }
    data.title = title.trim();
  }
  if (templateId !== undefined) {
    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    data.templateId = templateId;
  }
  if (fieldValues !== undefined) {
    data.fieldValues = fieldValues || null;
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data,
    include: {
      template: {
        select: {
          name: true,
        },
      },
      initiator: {
        select: {
          name: true,
        },
      },
    },
  });

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      action: "updated",
      documentId: id,
      userId: auth.userId,
      metadata: data,
    },
  });

  return NextResponse.json(updatedDocument);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Find document
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Check: only initiator or ADMIN can delete
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (document.initiatorId !== auth.userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete related approvals first
  await prisma.approval.deleteMany({
    where: { documentId: id },
  });

  // Delete document
  await prisma.document.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
