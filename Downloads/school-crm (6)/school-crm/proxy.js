import { NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "./lib/auth.js";
import { resolveUrl } from "./lib/requestUrl.js";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isPublicPath =
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/api/portal") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!(await isValidSessionToken(token))) {
    const loginUrl = resolveUrl("/login", request);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/login|_next|favicon.ico).*)"],
};
