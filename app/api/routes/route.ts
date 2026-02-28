import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const routes = await prisma.approvalRoute.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  let name: string, description: string | undefined, templateId: string, steps: any[];
  try {
    ({ name, description, templateId, steps } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name || !templateId || !steps || steps.length === 0) {
    return NextResponse.json(
      { error: "name, templateId, and steps are required" },
      { status: 400 }
    );
  }

  // Validate template exists
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: { approvalRoute: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.approvalRoute) {
    return NextResponse.json(
      { error: "Template already has an approval route" },
      { status: 400 }
    );
  }

  // Validate steps — each must have either approverRole OR at least one approverIds entry
  const VALID_APPROVER_ROLES = ["APPROVER", "ADMIN"];
  for (const step of steps) {
    if (!step.stepNumber || !step.name) {
      return NextResponse.json(
        { error: "Each step must have stepNumber and name" },
        { status: 400 }
      );
    }
    const hasRole  = step.approverRole && VALID_APPROVER_ROLES.includes(step.approverRole);
    const hasUsers = Array.isArray(step.approverIds) && step.approverIds.length > 0;
    if (!hasRole && !hasUsers) {
      return NextResponse.json(
        { error: `Step "${step.name}": must have either a role or at least one approver selected` },
        { status: 400 }
      );
    }
  }

  // Create route with steps
  const route = await prisma.approvalRoute.create({
    data: {
      name,
      description,
      templateId,
      steps: {
        create: steps.map((step) => ({
          stepNumber: step.stepNumber,
          name: step.name,
          description: step.description,
          approverIds: step.approverIds ?? [],
          approverRole: step.approverRole ?? null,
          requireAll: step.requireAll ?? false,
        })),
      },
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

  return NextResponse.json(route, { status: 201 });
}
