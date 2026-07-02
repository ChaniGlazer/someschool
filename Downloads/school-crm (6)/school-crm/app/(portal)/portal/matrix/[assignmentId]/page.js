import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { db } from "../../../../../lib/db.js";
import { PORTAL_SESSION_COOKIE, verifyPortalSessionToken } from "../../../../../lib/portalAuth.js";
import MatrixTable from "./MatrixTable.js";

export const dynamic = "force-dynamic";

export default async function PortalMatrixPage({ params }) {
  const { assignmentId } = await params;
  const id = Number(assignmentId);

  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  const teacherId = await verifyPortalSessionToken(token);

  if (!teacherId) {
    redirect("/portal");
  }

  const assignment = db
    .prepare(
      `SELECT ta.id, ta.teacher_id, ta.class_id, c.name as class_name, c.color as class_color,
              s.name as subject_name
       FROM teacher_assignments ta
       JOIN classes c ON c.id = ta.class_id
       JOIN subjects s ON s.id = ta.subject_id
       WHERE ta.id = ?`
    )
    .get(id);

  if (!assignment) {
    notFound();
  }

  // בדיקת אבטחה - השיוך חייב להיות שייך למורה המחובר, לא לכל מורה אחר שמנחש ID
  if (assignment.teacher_id !== teacherId) {
    redirect("/portal/classes");
  }

  const campaign = db
    .prepare("SELECT * FROM mapping_campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1")
    .get();

  const students = db
    .prepare("SELECT id, full_name FROM students WHERE class_id = ? ORDER BY full_name ASC")
    .all(assignment.class_id);

  const responses = campaign
    ? db
        .prepare(
          `SELECT student_id, score1, score2, score3, note
           FROM mapping_responses
           WHERE campaign_id = ? AND assignment_id = ?`
        )
        .all(campaign.id, id)
    : [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>
            <span style={{ color: assignment.class_color }}>{assignment.class_name}</span>
            {" · "}
            {assignment.subject_name}
          </h1>
          <p>מילוי מיפוי לתלמידי הכיתה - נשמר אוטומטית בכל שינוי</p>
        </div>
        <Link href="/portal/classes" className="btn btn-secondary">
          חזרה לכיתות
        </Link>
      </div>

      {!campaign ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין כרגע סבב מיפוי פעיל</h3>
            <p>היועץ/ת החינוכי/ת עדיין לא פתח/ה סבב מיפוי חדש. נסו שוב מאוחר יותר.</p>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין תלמידים משויכים לכיתה זו</h3>
          </div>
        </div>
      ) : (
        <MatrixTable
          assignmentId={id}
          campaignId={campaign.id}
          campaignParams={[campaign.param1_name, campaign.param2_name, campaign.param3_name]}
          students={JSON.parse(JSON.stringify(students))}
          initialResponses={JSON.parse(JSON.stringify(responses))}
        />
      )}
    </>
  );
}
