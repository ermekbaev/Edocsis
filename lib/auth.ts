import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";

// ─── getUser ──────────────────────────────────────────────────────────────────
// Extracts and verifies the JWT from Authorization: Bearer <token> header.
// Returns the payload or null if missing / invalid.

export async function getUser(req: NextRequest): Promise<JwtPayload | null> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    console.log("[AUTH] No Authorization header");
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.log("[AUTH] Authorization header doesn't start with 'Bearer '");
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("[AUTH] No token found after 'Bearer '");
    return null;
  }

  console.log("[AUTH] Token length:", token.length);

  try {
    const payload = await verifyToken(token);
    console.log("[AUTH] Token verified successfully for user:", payload.userId);
    return payload;
  } catch (err) {
    console.error("[AUTH] Token verification failed:", err);
    return null;
  }
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
// Use at the top of an API route handler.
// Returns the JwtPayload on success, or a 401 NextResponse to return early.
//
// Usage:
//   const auth = await requireAuth(req);
//   if (auth instanceof NextResponse) return auth;
//   // auth is now JwtPayload

export async function requireAuth(
  req: NextRequest,
): Promise<JwtPayload | NextResponse> {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

// ─── requireRole ──────────────────────────────────────────────────────────────
// Same as requireAuth but also checks that the user's role is in the allowed list.
// Returns 403 if the role doesn't match.
//
// Usage:
//   const auth = await requireRole(req, "ADMIN");
//   if (auth instanceof NextResponse) return auth;

export async function requireRole(
  req: NextRequest,
  ...roles: string[]
): Promise<JwtPayload | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}
