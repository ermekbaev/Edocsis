import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const positions = await prisma.position.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(positions);
  } catch (err: any) {
    console.error("[Positions GET]", err);
    return NextResponse.json({ error: "Не удалось загрузить роли" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  let name: string, description: string | undefined;
  try {
    ({ name, description } = await req.json());
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  try {
    const existing = await prisma.position.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Роль с таким названием уже существует" }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: { name: name.trim(), description: description?.trim() || null },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (err: any) {
    console.error("[Positions POST]", err);
    return NextResponse.json({ error: "Не удалось создать роль" }, { status: 500 });
  }
}
