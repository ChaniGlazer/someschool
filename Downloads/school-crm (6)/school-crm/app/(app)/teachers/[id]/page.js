import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

function Field({ label, value }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 15 }}>{value || "—"}</div>
    </div>
  );
}

export default async function TeacherFilePage({ params }) {
  const { id } = await params;
  const teacherId = Number(id);

  const teacher = db.prepare("SELECT * FROM teachers WHERE id = ?").get(teacherId);

  if (!teacher) {
    notFound();
  }

  const assignments = db
    .prepare(
      `SELECT c.id as class_id, c.name as class_name, c.color as class_color, s.name as subject_name
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
          <h1>תיק אישי - {teacher.full_name}</h1>
          <p>פרטי המורה ושיוך לכיתות ומקצועות</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/teachers" className="btn btn-secondary">
            חזרה למורים
          </Link>
          <Link href={`/teachers?edit=${teacher.id}`} className="btn btn-primary">
            עריכת פרטים
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <div className="card card-pad">
          <h2 style={{ marginBottom: 4 }}>פרטים אישיים</h2>
          <Field label="שם" value={teacher.full_name} />
          <Field label="ת.ז" value={teacher.tz} />
          <Field label="טלפון" value={teacher.phone} />
          <Field label='דוא"ל' value={teacher.email} />
          <Field label="כתובת" value={teacher.address} />

          {teacher.notes && (
            <>
              <h2 style={{ margin: "20px 0 4px" }}>הערות</h2>
              <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{teacher.notes}</p>
            </>
          )}
        </div>

        <div className="card card-pad">
          <h2 style={{ marginBottom: 12 }}>כיתות ומקצועות ({assignments.length})</h2>
          {assignments.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              אין עדיין שיוך לכיתה/מקצוע. ניתן להוסיף בעריכת הפרטים.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {assignments.map((a) => (
                <div
                  key={`${a.class_id}-${a.subject_name}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{a.subject_name}</strong>
                  <span
                    className="badge"
                    style={{ background: `${a.class_color}22`, color: a.class_color }}
                  >
                    <span className="badge-dot" style={{ background: a.class_color }} />
                    {a.class_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
