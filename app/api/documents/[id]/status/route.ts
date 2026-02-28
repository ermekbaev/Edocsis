import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["DRAFT", "IN_APPROVAL", "APPROVED", "REJECTED"] as const;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let status: string;
  try {
    ({ status } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status as any)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const document = await prisma.document.findUnique({ where: { id } });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status === status) {
    return NextResponse.json(
      { error: "Document is already in this status" },
      { status: 400 }
    );
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: { status: status as any },
  });

  await prisma.auditLog.create({
    data: {
      action: "status_changed",
      documentId: id,
      userId: auth.userId,
      metadata: { from: document.status, to: status, manual: true },
    },
  });

  return NextResponse.json(updatedDocument);
}
