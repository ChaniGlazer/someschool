// שימוש ב-Web Crypto (crypto.subtle) כדי שהקוד יעבוד גם ב-middleware (Edge runtime) וגם בשרת
const SECRET = process.env.SESSION_SECRET || "dev-secret-please-change";
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export const SESSION_COOKIE = "yoetz_session";

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

export async function createSessionToken() {
  const timestamp = Date.now().toString();
  const signature = await sign(timestamp);
  return `${timestamp}.${signature}`;
}

export async function isValidSessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }
  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature) return false;

  const expectedSignature = await sign(timestamp);
  if (signature.length !== expectedSignature.length) return false;
  if (signature !== expectedSignature) return false;

  const age = Date.now() - Number(timestamp);
  return age >= 0 && age < THIRTY_DAYS_MS;
}
