import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { db } from "../../../../lib/db.js";
import { PORTAL_SESSION_COOKIE, verifyPortalSessionToken } from "../../../../lib/portalAuth.js";

export const dynamic = "force-dynamic";

export default async function PortalClassesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  const teacherId = await verifyPortalSessionToken(token);

  if (!teacherId) {
    redirect("/portal");
  }

  const teacher = db.prepare("SELECT full_name FROM teachers WHERE id = ?").get(teacherId);
  if (!teacher) {
    redirect("/portal");
  }

  const assignments = db
    .prepare(
      `SELECT ta.id, c.name as class_name, c.color as class_color, s.name as subject_name
       FROM teacher_assignments ta
       JOIN classes c ON c.id = ta.class_id
       JOIN subjects s ON s.id = ta.subject_id
       WHERE ta.teacher_id = ?
       ORDER BY c.sort_order ASC, c.name ASC, s.name ASC`
    )
    .all(teacherId);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>שלום, {teacher.full_name}</h1>
          <p>בחרו כיתה ומקצוע כדי למלא מיפוי תלמידים</p>
        </div>
        <form action="/api/portal/logout" method="post">
          <button type="submit" className="btn btn-secondary">
            יציאה
          </button>
        </form>
      </div>

      {assignments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין עדיין שיוך לכיתה/מקצוע</h3>
            <p>פנו ליועץ/ת החינוכי/ת כדי לשייך אתכם לכיתה ומקצוע.</p>
          </div>
        </div>
      ) : (
        <div className="context-card-grid">
          {assignments.map((a) => (
            <Link key={a.id} href={`/portal/matrix/${a.id}`} className="context-card">
              <div className="context-card-class" style={{ color: a.class_color }}>
                {a.class_name}
              </div>
              <div className="context-card-subject">{a.subject_name}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
