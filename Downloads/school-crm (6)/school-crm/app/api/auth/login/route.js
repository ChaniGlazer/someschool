import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSessionToken, SESSION_COOKIE } from "../../../../lib/auth.js";
import { resolveUrl } from "../../../../lib/requestUrl.js";

export async function POST(request) {
  const formData = await request.formData();
  const password = formData.get("password")?.toString() || "";

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    const url = resolveUrl("/login", request);
    url.searchParams.set(
      "error",
      "לא הוגדרה סיסמת מנהל בשרת (ADMIN_PASSWORD_HASH). פנה להגדרות הפריסה."
    );
    return NextResponse.redirect(url, 303);
  }

  const isValid = password && bcrypt.compareSync(password, passwordHash);

  if (!isValid) {
    const url = resolveUrl("/login", request);
    url.searchParams.set("error", "סיסמה שגויה, נסה שוב.");
    return NextResponse.redirect(url, 303);
  }

  const token = await createSessionToken();
  const response = NextResponse.redirect(resolveUrl("/students", request), 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
