"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../lib/db.js";

const VALID_STATUSES = ["new", "in_progress", "done"];
const VALID_PRIORITIES = ["low", "normal", "urgent"];

export async function createInquiry(formData) {
  const studentId = Number(formData.get("studentId"));
  const subject = formData.get("subject")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString() || "normal";

  if (!studentId) return { error: "יש לבחור תלמיד." };
  if (!subject) return { error: "יש להזין נושא לפנייה." };
  if (!VALID_PRIORITIES.includes(priority)) return { error: "עדיפות לא תקינה." };

  db.prepare(
    "INSERT INTO inquiries (student_id, subject, description, priority, status) VALUES (?, ?, ?, ?, 'new')"
  ).run(studentId, subject, description, priority);

  revalidatePath("/inquiries");
  return { success: true };
}

export async function updateInquiry(formData) {
  const id = Number(formData.get("id"));
  const studentId = Number(formData.get("studentId"));
  const subject = formData.get("subject")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const priority = formData.get("priority")?.toString() || "normal";

  if (!id) return { error: "נתונים חסרים." };
  if (!studentId) return { error: "יש לבחור תלמיד." };
  if (!subject) return { error: "יש להזין נושא לפנייה." };
  if (!VALID_PRIORITIES.includes(priority)) return { error: "עדיפות לא תקינה." };

  db.prepare(
    `UPDATE inquiries
     SET student_id = ?, subject = ?, description = ?, priority = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(studentId, subject, description, priority, id);

  revalidatePath("/inquiries");
  return { success: true };
}

export async function updateInquiryStatus(formData) {
  const id = Number(formData.get("id"));
  const status = formData.get("status")?.toString();

  if (!id) return { error: "נתונים חסרים." };
  if (!VALID_STATUSES.includes(status)) return { error: "סטטוס לא תקין." };

  db.prepare(
    "UPDATE inquiries SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, id);

  revalidatePath("/inquiries");
  return { success: true };
}

export async function deleteInquiry(formData) {
  const id = Number(formData.get("id"));
  if (!id) return { error: "נתונים חסרים." };

  db.prepare("DELETE FROM inquiries WHERE id = ?").run(id);

  revalidatePath("/inquiries");
  return { success: true };
}
