import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  const debug: Record<string, any> = {
    hasAuthHeader: !!authHeader,
    authHeaderValue: authHeader || null,
    startsWithBearer: authHeader?.startsWith("Bearer ") || false,
  };

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ ...debug, error: "No valid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  debug.tokenLength = token?.length || 0;

  try {
    const payload = await verifyToken(token);
    return NextResponse.json({ ...debug, valid: true, payload });
  } catch (err) {
    return NextResponse.json({
      ...debug,
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
