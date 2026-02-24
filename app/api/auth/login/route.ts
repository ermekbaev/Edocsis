import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma }    from "@/lib/prisma";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  // ── Parse body ──────────────────────────────────────────────────────────────
  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  // ── Find user ───────────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { email } });

  // Use a constant-time comparison even when user is not found (prevents timing attacks)
  const passwordToCheck = user?.password ?? "$2b$12$invalidhashfortimingprotection";
  const valid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // ── Sign JWT ────────────────────────────────────────────────────────────────
  const token = await signToken({ userId: user.id, role: user.role });

  // ── Return token and user info ───────────────────────────────────────────────
  return NextResponse.json({
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
}
