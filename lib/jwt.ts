import { SignJWT, jwtVerify } from "jose";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  role:   string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production",
  );

const ALGORITHM = "HS256";
const EXPIRY    = "30d"; // 30 days for development

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret());
  return {
    userId: payload.userId as string,
    role:   payload.role   as string,
  };
}
