import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const route = await prisma.approvalRoute.findUnique({
    where: { id },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      steps: {
        orderBy: {
          stepNumber: "asc",
        },
      },
    },
  });

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return NextResponse.json(route);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let name: string | undefined, description: string | undefined, steps: any[] | undefined;
  try {
    ({ name, description, steps } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Find existing route
  const existingRoute = await prisma.approvalRoute.findUnique({
    where: { id },
    include: { steps: true },
  });

  if (!existingRoute) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  // If updating steps, delete old steps and create new ones
  if (steps) {
    await prisma.approvalRouteStep.deleteMany({
      where: { routeId: id },
    });
  }

  const route = await prisma.approvalRoute.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(steps && {
        steps: {
          create: steps.map((step) => ({
            stepNumber: step.stepNumber,
            name: step.name,
            description: step.description,
            approverIds: step.approverIds,
            requireAll: step.requireAll ?? false,
          })),
        },
      }),
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      steps: {
        orderBy: {
          stepNumber: "asc",
        },
      },
    },
  });

  return NextResponse.json(route);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const route = await prisma.approvalRoute.findUnique({
    where: { id },
  });

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  // Delete route (steps will be cascade deleted)
  await prisma.approvalRoute.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
