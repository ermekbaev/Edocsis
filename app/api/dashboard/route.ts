import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Get document counts by status for user's documents
  const [
    totalDocuments,
    draftCount,
    inApprovalCount,
    approvedCount,
    rejectedCount,
  ] = await Promise.all([
    prisma.document.count({
      where: { initiatorId: auth.userId },
    }),
    prisma.document.count({
      where: { initiatorId: auth.userId, status: "DRAFT" },
    }),
    prisma.document.count({
      where: { initiatorId: auth.userId, status: "IN_APPROVAL" },
    }),
    prisma.document.count({
      where: { initiatorId: auth.userId, status: "APPROVED" },
    }),
    prisma.document.count({
      where: { initiatorId: auth.userId, status: "REJECTED" },
    }),
  ]);

  // Get pending approvals (only for approvers)
  const pendingApprovals = auth.role === "APPROVER" || auth.role === "ADMIN"
    ? await prisma.document.findMany({
        where: {
          status: "IN_APPROVAL",
          currentApproverId: auth.userId,
        },
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
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      })
    : [];

  // Get recent documents (last 7 for table)
  const recentDocuments = await prisma.document.findMany({
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
    take: 7,
  });

  // Get recent activity (audit logs for user's documents)
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      document: {
        initiatorId: auth.userId,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          number: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return NextResponse.json({
    stats: {
      totalDocuments,
      byStatus: {
        draft: draftCount,
        inApproval: inApprovalCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      myDocuments: totalDocuments,
    },
    recentDocuments,
    pendingApprovals,
    recentActivity,
  });
}
