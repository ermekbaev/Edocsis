import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Get current user to check role
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  // Get query params
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const templateId = searchParams.get("templateId");

  // Build where conditions based on role
  const where: any = {};

  // Role-based filtering:
  // - ADMIN: see all documents
  // - APPROVER: see their own documents OR documents waiting for their approval
  // - USER: see only their own documents
  if (user?.role === "ADMIN") {
    // Admin sees all documents - no filter
  } else if (user?.role === "APPROVER") {
    // Approver sees their own documents OR documents they need to approve
    where.OR = [
      { initiatorId: auth.userId },
      { currentApproverId: auth.userId },
    ];
  } else {
    // USER sees only their own documents
    where.initiatorId = auth.userId;
  }

  if (search) {
    const searchCondition = [
      { title: { contains: search, mode: "insensitive" } },
      { number: { contains: search, mode: "insensitive" } },
    ];

    // Merge with existing OR condition if it exists
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchCondition },
      ];
      delete where.OR;
    } else {
      where.OR = searchCondition;
    }
  }

  if (status && ["DRAFT", "IN_APPROVAL", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }

  if (templateId) {
    where.templateId = templateId;
  }

  const documents = await prisma.document.findMany({
    where,
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
      currentApprover: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // APPROVER cannot create documents
  if (auth.role === "APPROVER") {
    return NextResponse.json(
      { error: "Approvers cannot create documents" },
      { status: 403 }
    );
  }

  let title: string, templateId: string, fieldValues: any;
  try {
    ({ title, templateId, fieldValues } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!title || !templateId) {
    return NextResponse.json(
      { error: "title and templateId are required" },
      { status: 400 },
    );
  }

  const year   = new Date().getFullYear();
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const number = `DOC-${year}-${digits}`;

  // Create document and audit log in a transaction
  const [document] = await prisma.$transaction([
    prisma.document.create({
      data: {
        number,
        title,
        status:      "DRAFT",
        templateId,
        initiatorId: auth.userId,
        fieldValues: fieldValues || null,
      },
    }),
  ]);

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      action: "created",
      documentId: document.id,
      userId: auth.userId,
      metadata: { title, templateId },
    },
  });

  return NextResponse.json(document, { status: 201 });
}
