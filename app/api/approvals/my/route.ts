import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const approvals = await prisma.approval.findMany({
    where: {
      approverId: auth.userId,
    },
    include: {
      document: {
        include: {
          initiator: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: {
      document: {
        createdAt: "desc",
      },
    },
  });

  const result = approvals.map((approval) => ({
    id: approval.id,
    documentId: approval.document.id,
    documentNumber: approval.document.number,
    documentTitle: approval.document.title,
    documentStatus: approval.document.status,
    approvalStatus: approval.status,
    stepNumber: approval.stepNumber,
    comment: approval.comment,
    decidedAt: approval.decidedAt,
    initiatorName: approval.document.initiator.name,
  }));

  return NextResponse.json(result);
}
