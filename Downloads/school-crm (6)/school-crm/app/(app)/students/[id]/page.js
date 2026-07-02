import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  new: { label: "חדש", className: "badge-priority-low" },
  in_progress: { label: "בטיפול", className: "badge-priority-normal" },
  done: { label: "טופל", className: "badge-priority-urgent" },
};

const PRIORITY_LABELS = {
  low: "נמוכה",
  normal: "רגילה",
  urgent: "דחופה",
};

function formatDate(isoLike) {
  if (!isoLike) return "";
  const d = new Date(isoLike.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

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

export default async function StudentFilePage({ params }) {
  const { id } = await params;
  const studentId = Number(id);

  const student = db
    .prepare(
      `SELECT s.*, c.name as class_name, c.color as class_color
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = ?`
    )
    .get(studentId);

  if (!student) {
    notFound();
  }

  const inquiries = db
    .prepare(
      `SELECT id, subject, description, priority, status, created_at
       FROM inquiries
       WHERE student_id = ?
       ORDER BY created_at DESC`
    )
    .all(studentId);

  const meetings = db
    .prepare(
      `SELECT m.id, m.meeting_date, m.title, m.participants
       FROM meetings m
       JOIN meeting_students ms ON ms.meeting_id = m.id
       WHERE ms.student_id = ?
       ORDER BY m.meeting_date DESC, m.id DESC`
    )
    .all(studentId);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>תיק אישי - {student.full_name}</h1>
          <p>כל הפרטים והפניות עבור התלמיד/ה במקום אחד</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/students" className="btn btn-secondary">
            חזרה לתלמידים
          </Link>
          <Link href={`/students?edit=${student.id}`} className="btn btn-primary">
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
          <h2 style={{ marginBottom: 4 }}>פרטי תלמיד</h2>
          {student.class_name && (
            <div style={{ margin: "8px 0 4px" }}>
              <span
                className="badge"
                style={{ background: `${student.class_color}22`, color: student.class_color }}
              >
                <span className="badge-dot" style={{ background: student.class_color }} />
                {student.class_name}
              </span>
            </div>
          )}

          <Field label="שם" value={student.full_name} />
          <Field label="ת.ז" value={student.tz} />
          <Field label="תאריך לידה" value={student.birth_date} />
          <Field label="רחוב" value={student.street} />
          <Field label="עיר" value={student.city} />
          <Field label="טלפון נייד" value={student.phone_mobile} />
          <Field label='דוא"ל' value={student.email} />

          <h2 style={{ margin: "20px 0 4px" }}>הורים</h2>
          <Field label="שם אב" value={student.guardian1_name} />
          <Field label='ת"ז אב' value={student.guardian1_tz} />
          <Field label="טלפון אב" value={student.guardian1_phone} />
          <Field label="שם האם" value={student.guardian2_name} />
          <Field label="טלפון אם" value={student.guardian2_phone} />

          {student.notes && (
            <>
              <h2 style={{ margin: "20px 0 4px" }}>הערות</h2>
              <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{student.notes}</p>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2>פניות ({inquiries.length})</h2>
              <Link href={`/inquiries?newForStudent=${student.id}`} className="btn btn-primary btn-sm">
                + פנייה חדשה
              </Link>
            </div>

            {inquiries.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                אין עדיין פניות עבור תלמיד/ה זה.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inquiries.map((inquiry) => {
                  const statusInfo = STATUS_LABELS[inquiry.status] || STATUS_LABELS.new;
                  return (
                    <div
                      key={inquiry.id}
                      style={{
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <strong style={{ fontSize: 14 }}>{inquiry.subject}</strong>
                        <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
                      </div>
                      {inquiry.description && (
                        <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 6 }}>
                          {inquiry.description}
                        </p>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-muted)" }}>
                        <span>עדיפות: {PRIORITY_LABELS[inquiry.priority] || inquiry.priority}</span>
                        <span>{formatDate(inquiry.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card card-pad">
            <h2 style={{ marginBottom: 12 }}>פגישות ({meetings.length})</h2>
            {meetings.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
                אין עדיין פגישות מתועדות עבור תלמיד/ה זה.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <strong style={{ fontSize: 14 }}>{meeting.title}</strong>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {formatDate(meeting.meeting_date + "T00:00:00")}
                      </span>
                    </div>
                    {meeting.participants && (
                      <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        משתתפים: {meeting.participants}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
