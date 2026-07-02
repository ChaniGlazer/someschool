import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db.js";

function findOrCreateSubjectId(subjectName) {
  const existing = db.prepare("SELECT id FROM subjects WHERE name = ?").get(subjectName);
  if (existing) return existing.id;
  const result = db.prepare("INSERT INTO subjects (name) VALUES (?)").run(subjectName);
  return Number(result.lastInsertRowid);
}

function cleanTz(rawTz) {
  if (!rawTz) return null;
  const digits = String(rawTz).replace(/\D/g, "");
  if (!digits || digits.length > 9) return null;
  return digits.padStart(9, "0");
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const rows = Array.isArray(body?.rows) ? body.rows : [];
  const importable = rows.filter((r) => r?.full_name);

  if (importable.length === 0) {
    return NextResponse.json({ error: "אין שורות תקינות לייבוא." }, { status: 400 });
  }

  const existingTeachers = db.prepare("SELECT id, full_name, email, tz FROM teachers").all();
  const existingKeyToId = {};
  for (const t of existingTeachers) {
    const key = (t.tz || t.email || t.full_name).trim().toLowerCase();
    existingKeyToId[key] = t.id;
  }

  const insertTeacher = db.prepare(
    "INSERT INTO teachers (full_name, tz, email, phone, address) VALUES (?, ?, ?, ?, ?)"
  );
  const updateTeacher = db.prepare(
    `UPDATE teachers SET
       full_name = ?,
       tz = COALESCE(?, tz),
       email = COALESCE(?, email),
       phone = COALESCE(?, phone),
       address = COALESCE(?, address)
     WHERE id = ?`
  );
  const insertAssignment = db.prepare(
    "INSERT OR IGNORE INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES (?, ?, ?)"
  );

  let created = 0;
  let updated = 0;
  let assignmentsAdded = 0;

  db.exec("BEGIN");
  try {
    for (const row of importable) {
      const tz = cleanTz(row.tz);
      const key = (tz || row.email || row.full_name).trim().toLowerCase();
      let teacherId = existingKeyToId[key];

      if (teacherId) {
        updateTeacher.run(row.full_name, tz, row.email || null, row.phone || null, row.address || null, teacherId);
        updated += 1;
      } else {
        const result = insertTeacher.run(
          row.full_name,
          tz,
          row.email || null,
          row.phone || null,
          row.address || null
        );
        teacherId = Number(result.lastInsertRowid);
        existingKeyToId[key] = teacherId;
        created += 1;
      }

      for (const assignment of row.assignments || []) {
        if (!assignment.classId || !assignment.subjectName) continue;
        const subjectId = findOrCreateSubjectId(assignment.subjectName);
        const result = insertAssignment.run(teacherId, assignment.classId, subjectId);
        if (result.changes > 0) assignmentsAdded += 1;
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    return NextResponse.json(
      { error: "שגיאה בשמירת הנתונים: " + (err.message || "") },
      { status: 500 }
    );
  }

  return NextResponse.json({ created, updated, assignmentsAdded });
}
