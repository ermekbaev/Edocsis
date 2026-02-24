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

  let name: string | undefined,
    role: string | undefined,
    department: string | undefined;
  try {
    ({ name, role, department } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent admin from changing their own role (safety)
  if (id === auth.userId && role !== undefined && role !== user.role) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  // Validate role if provided
  if (role !== undefined && !["USER", "APPROVER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Build update data
  const data: { name?: string; role?: "USER" | "APPROVER" | "ADMIN"; department?: string | null } = {};
  if (name !== undefined) {
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 }
      );
    }
    data.name = name.trim();
  }
  if (role !== undefined) {
    data.role = role as "USER" | "APPROVER" | "ADMIN";
  }
  if (department !== undefined) {
    data.department = department.trim() || null;
  }

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
    },
  });

  return NextResponse.json(updatedUser);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Prevent admin from deleting themselves
  if (id === auth.userId) {
    return NextResponse.json(
      { error: "Cannot delete yourself" },
      { status: 400 }
    );
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Hard delete (since we don't have a status field for soft delete)
  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
