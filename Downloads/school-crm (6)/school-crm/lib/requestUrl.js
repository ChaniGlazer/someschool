// Render (וכל שירות שרץ מאחורי reverse proxy) לפעמים מעביר ל-Node.js בקשות
// שבהן request.url מכיל כתובת פנימית (למשל localhost) במקום הדומיין הציבורי
// שממנו המשתמש ניגש בפועל. הפרוקסי כן מוסיף את הכותרות התקניות
// X-Forwarded-Host / X-Forwarded-Proto עם הכתובת הנכונה - נשתמש בהן קודם,
// ונשתמש ב-request.url רק כברירת מחדל (למשל בפיתוח מקומי).
export function getRequestOrigin(request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function resolveUrl(path, request) {
  return new URL(path, getRequestOrigin(request));
}
