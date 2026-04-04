import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (err: any) {
    console.error("[Users GET]", err);
    return NextResponse.json({ error: "Не удалось загрузить пользователей" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  let email: string, name: string, role: string, department: string | undefined, password: string, positionId: string | undefined;
  try {
    ({ email, name, role, department, password, positionId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  if (!email || !name || !role || !password) {
    return NextResponse.json({ error: "email, name, role и password обязательны" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль должен содержать минимум 6 символов" }, { status: 400 });
  }

  if (!["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as "USER" | "INITIATOR" | "APPROVER" | "ADMIN",
        password: hashedPassword,
        department: department || null,
        positionId: positionId || null,
      },
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

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    console.error("[Users POST]", err);
    return NextResponse.json({ error: "Не удалось создать пользователя" }, { status: 500 });
  }
}
