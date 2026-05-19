import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "pr_gradient_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth endpoints and login page through.
  if (pathname.startsWith("/api/auth") || pathname === "/login") {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE);
  const expected = process.env.AUTH_TOKEN ?? "";

  if (!cookie || cookie.value !== expected) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
