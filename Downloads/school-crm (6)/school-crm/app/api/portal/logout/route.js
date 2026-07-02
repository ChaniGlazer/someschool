import { NextResponse } from "next/server";
import { PORTAL_SESSION_COOKIE } from "../../../../lib/portalAuth.js";
import { resolveUrl } from "../../../../lib/requestUrl.js";

export async function POST(request) {
  const response = NextResponse.redirect(resolveUrl("/portal", request), 303);
  response.cookies.delete(PORTAL_SESSION_COOKIE);
  return response;
}
