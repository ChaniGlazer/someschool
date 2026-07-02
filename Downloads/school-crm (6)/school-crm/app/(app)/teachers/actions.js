"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../lib/db.js";
import { isValidIsraeliId, normalizeIsraeliId } from "../../../lib/validators.js";

function parseAssignments(formData) {
  const raw = formData.get("assignments")?.toString() || "[]";
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((a) => ({
        classId: Number(a.classId),
        subjectName: (a.subjectName || "").toString().trim(),
      }))
      .filter((a) => a.classId && a.subjectName);
  } catch {
    return [];
  }
}

// מוצא מקצוע קיים לפי שם, או יוצר חדש אם לא קיים - כדי שלא ייווצרו כפילויות עם רווחים/אותיות שונות
function findOrCreateSubjectId(subjectName) {
  const existing = db.prepare("SELECT id FROM subjects WHERE name = ?").get(subjectName);
  if (existing) return existing.id;
  const result = db.prepare("INSERT INTO subjects (name) VALUES (?)").run(subjectName);
  return Number(result.lastInsertRowid);
}

// מסנכרן שיוכים בלי להרוס ID-ים של שיוכים שלא השתנו - חשוב כי mapping_responses
// (תשובות סבב המיפוי) תלויות ב-assignment_id. מחיקה-והוספה-מחדש גורפת הייתה מוחקת
// בטעות את כל נתוני המיפוי בכל עריכת פרטי מורה תמימה.
function syncAssignments(teacherId, assignments) {
  const existingRows = db
    .prepare(
      `SELECT ta.id, ta.class_id, s.name as subject_name
       FROM teacher_assignments ta
       JOIN subjects s ON s.id = ta.subject_id
       WHERE ta.teacher_id = ?`
    )
    .all(teacherId);

  const desiredKeys = new Set(assignments.map((a) => `${a.classId}::${a.subjectName}`));
  const existingKeys = new Set(existingRows.map((r) => `${r.class_id}::${r.subject_name}`));

  const toDelete = existingRows.filter((r) => !desiredKeys.has(`${r.class_id}::${r.subject_name}`));
  const toAdd = assignments.filter((a) => !existingKeys.has(`${a.classId}::${a.subjectName}`));

  const deleteStmt = db.prepare("DELETE FROM teacher_assignments WHERE id = ?");
  for (const row of toDelete) deleteStmt.run(row.id);

  const insert = db.prepare(
    "INSERT OR IGNORE INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES (?, ?, ?)"
  );
  for (const { classId, subjectName } of toAdd) {
    const subjectId = findOrCreateSubjectId(subjectName);
    insert.run(teacherId, classId, subjectId);
  }
}

export async function createTeacher(formData) {
  const fullName = formData.get("fullName")?.toString().trim();
  const tzRaw = formData.get("tz")?.toString().trim();
  const email = formData.get("email")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;
  const assignments = parseAssignments(formData);

  if (!fullName) return { error: "יש להזין שם מורה." };
  if (tzRaw && !isValidIsraeliId(tzRaw)) return { error: "תעודת הזהות אינה תקינה." };
  const tz = tzRaw ? normalizeIsraeliId(tzRaw) : null;

  let result;
  try {
    result = db
      .prepare(
        "INSERT INTO teachers (full_name, tz, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(fullName, tz, email, phone, address, notes);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { error: "כבר קיים מורה עם תעודת זהות זו." };
    }
    return { error: "שגיאה בשמירת המורה." };
  }

  syncAssignments(Number(result.lastInsertRowid), assignments);

  revalidatePath("/teachers");
  return { success: true };
}

export async function updateTeacher(formData) {
  const id = Number(formData.get("id"));
  const fullName = formData.get("fullName")?.toString().trim();
  const tzRaw = formData.get("tz")?.toString().trim();
  const email = formData.get("email")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;
  const assignments = parseAssignments(formData);

  if (!id) return { error: "נתונים חסרים." };
  if (!fullName) return { error: "יש להזין שם מורה." };
  if (tzRaw && !isValidIsraeliId(tzRaw)) return { error: "תעודת הזהות אינה תקינה." };
  const tz = tzRaw ? normalizeIsraeliId(tzRaw) : null;

  try {
    db.prepare(
      "UPDATE teachers SET full_name = ?, tz = ?, email = ?, phone = ?, address = ?, notes = ? WHERE id = ?"
    ).run(fullName, tz, email, phone, address, notes, id);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { error: "כבר קיים מורה עם תעודת זהות זו." };
    }
    return { error: "שגיאה בעדכון המורה." };
  }

  syncAssignments(id, assignments);

  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
  return { success: true };
}

export async function deleteTeacher(formData) {
  const id = Number(formData.get("id"));
  if (!id) return { error: "נתונים חסרים." };

  db.prepare("DELETE FROM teachers WHERE id = ?").run(id);

  revalidatePath("/teachers");
  return { success: true };
}
