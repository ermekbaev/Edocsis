import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let name: string | undefined, description: string | undefined;
  try {
    ({ name, description } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = await prisma.position.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Роль не найдена" }, { status: 404 });
  }

  if (name !== undefined) {
    const duplicate = await prisma.position.findFirst({
      where: { name: name.trim(), NOT: { id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Роль с таким названием уже существует" }, { status: 400 });
    }
  }

  const position = await prisma.position.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() || null }),
    },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(position);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  const existing = await prisma.position.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Роль не найдена" }, { status: 404 });
  }

  if (existing._count.users > 0) {
    // Unlink users before deleting
    await prisma.user.updateMany({
      where: { positionId: id },
      data: { positionId: null },
    });
  }

  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
