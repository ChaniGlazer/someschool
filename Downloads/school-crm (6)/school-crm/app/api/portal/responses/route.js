import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../lib/db.js";
import { PORTAL_SESSION_COOKIE, verifyPortalSessionToken } from "../../../../lib/portalAuth.js";

const ALLOWED_FIELDS = ["score1", "score2", "score3", "note"];

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  const teacherId = await verifyPortalSessionToken(token);

  if (!teacherId) {
    return NextResponse.json({ error: "יש להתחבר מחדש." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const assignmentId = Number(body?.assignmentId);
  const campaignId = Number(body?.campaignId);
  const studentId = Number(body?.studentId);
  const field = body?.field;
  const value = body?.value;

  if (!assignmentId || !campaignId || !studentId) {
    return NextResponse.json({ error: "נתונים חסרים." }, { status: 400 });
  }
  if (!ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "שדה לא תקין." }, { status: 400 });
  }

  // בדיקת אבטחה - השיוך חייב לשייך למורה המחובר בפועל
  const assignment = db
    .prepare("SELECT teacher_id, class_id FROM teacher_assignments WHERE id = ?")
    .get(assignmentId);
  if (!assignment || assignment.teacher_id !== teacherId) {
    return NextResponse.json({ error: "אין הרשאה לשיוך זה." }, { status: 403 });
  }

  // ודא שהתלמיד אכן שייך לכיתה של השיוך הזה
  const student = db
    .prepare("SELECT id FROM students WHERE id = ? AND class_id = ?")
    .get(studentId, assignment.class_id);
  if (!student) {
    return NextResponse.json({ error: "תלמיד/ה לא שייכים לכיתה זו." }, { status: 400 });
  }

  const campaign = db
    .prepare("SELECT id FROM mapping_campaigns WHERE id = ? AND status = 'active'")
    .get(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: "סבב המיפוי כבר אינו פעיל." }, { status: 400 });
  }

  const columnValue = field === "note" ? (value?.toString().trim() || null) : Number(value) || null;

  // whitelist מוגן - שם העמודה מגיע אך ורק מ-ALLOWED_FIELDS, לא ישירות מהקלט
  db.prepare(
    `INSERT INTO mapping_responses (campaign_id, assignment_id, student_id, ${field})
     VALUES (?, ?, ?, ?)
     ON CONFLICT(campaign_id, assignment_id, student_id)
     DO UPDATE SET ${field} = excluded.${field}, updated_at = datetime('now')`
  ).run(campaignId, assignmentId, studentId, columnValue);

  return NextResponse.json({ success: true });
}
