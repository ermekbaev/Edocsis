import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let name: string | undefined,
    role: string | undefined,
    department: string | undefined,
    positionId: string | null | undefined,
    password: string | undefined;
  try {
    ({ name, role, department, positionId, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Нельзя менять свою роль
    if (id === auth.userId && role !== undefined && role !== user.role) {
      return NextResponse.json({ error: "Нельзя изменить свою роль" }, { status: 400 });
    }

    if (role !== undefined && !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
    }

    if (password !== undefined && password.length < 6) {
      return NextResponse.json({ error: "Пароль должен содержать минимум 6 символов" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "Имя не может быть пустым" }, { status: 400 });
      data.name = name.trim();
    }
    if (role !== undefined) data.role = role;
    if (department !== undefined) data.department = department.trim() || null;
    if (positionId !== undefined) data.positionId = positionId || null;
    if (password !== undefined) data.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        positionId: true,
        position: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    console.error("[Users PUT]", err);
    return NextResponse.json({ error: "Не удалось обновить пользователя" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  if (id === auth.userId) {
    return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Users DELETE]", err);
    return NextResponse.json({ error: "Не удалось удалить пользователя" }, { status: 500 });
  }
}
