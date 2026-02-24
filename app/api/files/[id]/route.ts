import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  // Get file record
  const file = await prisma.file.findUnique({
    where: { id },
    include: {
      document: {
        select: {
          initiatorId: true,
        },
      },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Check permissions: only file uploader, document initiator, or ADMIN can delete
  if (
    file.userId !== auth.userId &&
    file.document.initiatorId !== auth.userId &&
    auth.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "You don't have permission to delete this file" },
      { status: 403 }
    );
  }

  try {
    // Delete physical file
    const filePath = path.join(process.cwd(), "public", file.path);
    try {
      await unlink(filePath);
    } catch (err) {
      console.error("Failed to delete physical file:", err);
      // Continue with database deletion even if file is missing
    }

    // Delete database record
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
