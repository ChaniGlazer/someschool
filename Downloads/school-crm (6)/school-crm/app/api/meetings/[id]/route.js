import { NextResponse } from "next/server";
import { db } from "../../../../lib/db.js";
import { deleteMeetingAttachmentFile } from "../../../../lib/uploads.js";

export async function PUT(request, { params }) {
  const { id } = await params;
  const meetingId = Number(id);

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

  if (!meetingId) return NextResponse.json({ error: "נתונים חסרים." }, { status: 400 });
  if (!meetingDate) return NextResponse.json({ error: "יש להזין תאריך פגישה." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "יש להזין כותרת לפגישה." }, { status: 400 });

  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE meetings
       SET meeting_date = ?, title = ?, participants = ?, summary = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(meetingDate, title, participants, summary, meetingId);

    db.prepare("DELETE FROM meeting_students WHERE meeting_id = ?").run(meetingId);
    const linkStudent = db.prepare(
      "INSERT OR IGNORE INTO meeting_students (meeting_id, student_id) VALUES (?, ?)"
    );
    for (const studentId of studentIds) {
      if (studentId) linkStudent.run(meetingId, studentId);
    }

    db.exec("COMMIT");
    return NextResponse.json({ success: true });
  } catch (err) {
    db.exec("ROLLBACK");
    return NextResponse.json(
      { error: "שגיאה בעדכון הפגישה: " + (err.message || "") },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const meetingId = Number(id);
  if (!meetingId) return NextResponse.json({ error: "נתונים חסרים." }, { status: 400 });

  const attachments = db
    .prepare("SELECT stored_name FROM meeting_attachments WHERE meeting_id = ?")
    .all(meetingId);

  db.prepare("DELETE FROM meetings WHERE id = ?").run(meetingId);

  for (const a of attachments) {
    deleteMeetingAttachmentFile(a.stored_name);
  }

  return NextResponse.json({ success: true });
}
