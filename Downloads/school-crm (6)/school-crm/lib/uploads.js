import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { DATA_DIR } from "./db.js";

const UPLOADS_DIR = path.join(DATA_DIR, "uploads", "meetings");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// שם קובץ בטוח לדיסק: מזהה אקראי + סיומת מקורית בלבד (לא שומרים את השם המקורי כפי שהוא, כדי למנוע path traversal)
function buildStoredName(originalName) {
  const ext = path.extname(originalName || "").slice(0, 12);
  const safeExt = /^[a-zA-Z0-9.]*$/.test(ext) ? ext : "";
  return `${crypto.randomUUID()}${safeExt}`;
}

export async function saveMeetingAttachment(file) {
  ensureUploadsDir();
  const storedName = buildStoredName(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buffer);
  return {
    storedName,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
  };
}

export function readMeetingAttachment(storedName) {
  // הגנה בסיסית מפני path traversal - השם חייב להיות UUID+סיומת בלבד, בלי תווי נתיב
  if (!/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9]+)?$/.test(storedName)) {
    return null;
  }
  const filePath = path.join(UPLOADS_DIR, storedName);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function deleteMeetingAttachmentFile(storedName) {
  if (!/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9]+)?$/.test(storedName)) return;
  const filePath = path.join(UPLOADS_DIR, storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
