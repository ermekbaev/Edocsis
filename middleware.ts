import { NextRequest, NextResponse } from "next/server";

// Auth is handled client-side via localStorage.
// Middleware passes all requests through.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
