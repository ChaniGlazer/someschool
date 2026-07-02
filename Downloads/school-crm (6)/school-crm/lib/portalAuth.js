// Session נפרד לחלוטין מה-session של היועץ (lib/auth.js) - זהו זיהוי מהיר של מורה
// (לפי ת.ז בלבד, ללא סיסמה), לא הרשאה מאובטחת. החתימה מונעת זיוף/שינוי של ה-teacherId
// בעוגייה, אבל לא מונעת ממורה להתחזות למורה אחר אם הוא יודע/מנחש את מספר תעודת הזהות שלו -
// זו פשרה מכוונת לטובת כניסה מהירה, כמבוקש.
const SECRET = process.env.SESSION_SECRET || "dev-secret-please-change";
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export const PORTAL_SESSION_COOKIE = "portal_session";

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(value) {
  const key = await getKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(signatureBuffer);
}

export async function createPortalSessionToken(teacherId) {
  const payload = `${teacherId}.${Date.now()}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

// מחזיר את ה-teacherId אם הטוקן תקין, אחרת null
export async function verifyPortalSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [teacherId, timestamp, signature] = parts;

  const payload = `${teacherId}.${timestamp}`;
  const expectedSignature = await sign(payload);
  if (signature.length !== expectedSignature.length) return null;
  if (signature !== expectedSignature) return null;

  const age = Date.now() - Number(timestamp);
  if (!(age >= 0 && age < THIRTY_DAYS_MS)) return null;

  const id = Number(teacherId);
  return Number.isInteger(id) && id > 0 ? id : null;
}
