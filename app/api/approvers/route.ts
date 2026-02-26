import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const approvers = await prisma.user.findMany({
    where: {
      role: { in: ["APPROVER", "ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(approvers);
}
