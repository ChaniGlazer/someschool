import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db.js";
import { parseWorkbook, buildTeacherPreview } from "../../../../../lib/importTeachers.js";

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "לא ניתן לקרוא את הבקשה." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "לא נבחר קובץ." }, { status: 400 });
  }

  let records;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    records = parseWorkbook(buffer);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "שגיאה בקריאת קובץ האקסל. ודאו שהקובץ תקין." },
      { status: 400 }
    );
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "לא נמצאו שורות נתונים בקובץ." }, { status: 400 });
  }

  const classes = db.prepare("SELECT id, name FROM classes").all();
  const classNameToId = {};
  for (const cls of classes) classNameToId[cls.name] = cls.id;

  const existingTeachers = db.prepare("SELECT id, full_name, email, tz FROM teachers").all();
  const existingTeacherKeyToId = {};
  for (const t of existingTeachers) {
    const key = (t.tz || t.email || t.full_name).trim().toLowerCase();
    existingTeacherKeyToId[key] = t.id;
  }

  const { rows, missingNameCount } = buildTeacherPreview(records, {
    classNameToId,
    existingTeacherKeyToId,
  });

  const summary = {
    total: rows.length,
    toCreate: rows.filter((r) => r.status === "create").length,
    toUpdate: rows.filter((r) => r.status === "update").length,
    warnings: rows.filter((r) => r.issues.length > 0).length,
    skippedMissingName: missingNameCount,
  };

  return NextResponse.json({ rows, summary });
}
