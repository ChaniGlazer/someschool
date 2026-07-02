import { NextResponse } from "next/server";
import { db } from "../../../../lib/db.js";
import { normalizeIsraeliId } from "../../../../lib/validators.js";
import { createPortalSessionToken, PORTAL_SESSION_COOKIE } from "../../../../lib/portalAuth.js";
import { resolveUrl } from "../../../../lib/requestUrl.js";

export async function POST(request) {
  const formData = await request.formData();
  const tzRaw = formData.get("tz")?.toString().trim() || "";
  const tz = /^\d{1,9}$/.test(tzRaw) ? normalizeIsraeliId(tzRaw) : tzRaw;

  const teacher = db.prepare("SELECT id FROM teachers WHERE tz = ?").get(tz);

  if (!teacher) {
    const url = resolveUrl("/portal", request);
    url.searchParams.set(
      "error",
      "לא נמצא מורה עם תעודת הזהות הזו. פנו ליועץ/ת להשלמת הפרטים במערכת."
    );
    return NextResponse.redirect(url, 303);
  }

  const token = await createPortalSessionToken(teacher.id);
  const response = NextResponse.redirect(resolveUrl("/portal/classes", request), 303);
  response.cookies.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
