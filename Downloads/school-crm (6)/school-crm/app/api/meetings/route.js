import { NextResponse } from "next/server";
import { db } from "../../../lib/db.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const meetingDate = body?.meetingDate?.toString().trim();
  const title = body?.title?.toString().trim();
  const participants = body?.participants?.toString().trim() || null;
  const summary = body?.summary?.toString() || null;
  const studentIds = Array.isArray(body?.studentIds) ? body.studentIds.map(Number) : [];

  if (!meetingDate) return NextResponse.json({ error: "יש להזין תאריך פגישה." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "יש להזין כותרת לפגישה." }, { status: 400 });

  db.exec("BEGIN");
  try {
    const result = db
      .prepare(
        "INSERT INTO meetings (meeting_date, title, participants, summary) VALUES (?, ?, ?, ?)"
      )
      .run(meetingDate, title, participants, summary);

    const meetingId = Number(result.lastInsertRowid);

    const linkStudent = db.prepare(
      "INSERT OR IGNORE INTO meeting_students (meeting_id, student_id) VALUES (?, ?)"
    );
    for (const studentId of studentIds) {
      if (studentId) linkStudent.run(meetingId, studentId);
    }

    db.exec("COMMIT");
    return NextResponse.json({ id: meetingId });
  } catch (err) {
    db.exec("ROLLBACK");
    return NextResponse.json(
      { error: "שגיאה בשמירת הפגישה: " + (err.message || "") },
      { status: 500 }
    );
  }
}
