import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../lib/auth.js";
import { resolveUrl } from "../../../../lib/requestUrl.js";

export async function POST(request) {
  const response = NextResponse.redirect(resolveUrl("/login", request), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
