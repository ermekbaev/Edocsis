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

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      approvalRoute: {
        include: {
          steps: {
            orderBy: {
              stepNumber: "asc",
            },
          },
        },
      },
      _count: {
        select: {
          documents: true,
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let name: string | undefined, description: string | undefined, content: string | undefined, fields: any;
  try {
    ({ name, description, content, fields } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Check if template exists
  const existing = await prisma.template.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Build update data
  const data: { name?: string; description?: string | null; content?: string | null; fields?: any } = {};
  if (name !== undefined) {
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 }
      );
    }
    data.name = name.trim();
  }
  if (description !== undefined) {
    data.description = description?.trim() || null;
  }
  if (content !== undefined) {
    data.content = content?.trim() || null;
  }
  if (fields !== undefined) {
    data.fields = fields || null;
  }

  const template = await prisma.template.update({
    where: { id },
    data,
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Check if template exists
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          documents: true,
        },
      },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Check if template has documents
  if (template._count.documents > 0) {
    return NextResponse.json(
      { error: "Cannot delete template with existing documents" },
      { status: 400 }
    );
  }

  await prisma.template.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
