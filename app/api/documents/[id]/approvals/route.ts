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

  // Get all approvals for this document
  const approvals = await prisma.approval.findMany({
    where: { documentId: id },
    include: {
      approver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { stepNumber: "asc" },
      { decidedAt: "asc" },
    ],
  });

  return NextResponse.json(approvals);
}
