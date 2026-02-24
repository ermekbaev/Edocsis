import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const templates = await prisma.template.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  let name: string, description: string | undefined, content: string | undefined, fields: any;
  try {
    ({ name, description, content, fields } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name || name.trim().length === 0) {
    return NextResponse.json(
      { error: "name is required and cannot be empty" },
      { status: 400 }
    );
  }

  const template = await prisma.template.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
      content: content?.trim(),
      fields: fields || null,
      createdById: auth.userId,
    },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json(template, { status: 201 });
}
