"use client";

import { useState, useTransition } from "react";
import { startNewCampaign } from "./actions.js";

function ProgressBadge({ total, responded }) {
  if (total === 0) {
    return <span className="badge" style={{ background: "#eeeade", color: "#6f7566" }}>אין תלמידים</span>;
  }
  const pct = Math.round((responded / total) * 100);
  if (pct === 100) {
    return <span className="badge badge-priority-low">הושלם - 100%</span>;
  }
  if (pct === 0) {
    return <span className="badge badge-priority-urgent">טרם החל - 0%</span>;
  }
  return <span className="badge badge-priority-normal">בתהליך - {pct}%</span>;
}

export default function MappingDashboard({ activeCampaign, progress }) {
  const [param1, setParam1] = useState(activeCampaign?.param1_name || "");
  const [param2, setParam2] = useState(activeCampaign?.param2_name || "");
  const [param3, setParam3] = useState(activeCampaign?.param3_name || "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStartCampaign() {
    setError("");
    if (!param1.trim() || !param2.trim() || !param3.trim()) {
      setError("יש למלא את שלושת שמות הפרמטרים.");
      return;
    }

    const formData = new FormData();
    formData.set("param1Name", param1.trim());
    formData.set("param2Name", param2.trim());
    formData.set("param3Name", param3.trim());

    startTransition(async () => {
      const result = await startNewCampaign(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setConfirmOpen(false);
      }
    });
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>מיפוי תלמידים - לוח בקרה</h1>
          <p>הגדרת פרמטרי המיפוי ומעקב אחר התקדמות המורים</p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 4 }}>הגדרת סבב מיפוי</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 16 }}>
          {activeCampaign
            ? "סבב המיפוי הנוכחי פעיל. פתיחת סבב חדש תשבית אותו ותפתח סבב חדש עם השמות שתזינו."
            : "אין כרגע סבב מיפוי פעיל. מלאו את שמות הפרמטרים ופתחו סבב ראשון."}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="field">
            <label htmlFor="param1">פרמטר 1</label>
            <input id="param1" value={param1} onChange={(e) => setParam1(e.target.value)} placeholder="לדוגמה: תפקוד חברתי" />
          </div>
          <div className="field">
            <label htmlFor="param2">פרמטר 2</label>
            <input id="param2" value={param2} onChange={(e) => setParam2(e.target.value)} placeholder="לדוגמה: מעורבות בשיעור" />
          </div>
          <div className="field">
            <label htmlFor="param3">פרמטר 3</label>
            <input id="param3" value={param3} onChange={(e) => setParam3(e.target.value)} placeholder="לדוגמה: הישגים לימודיים" />
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setConfirmOpen(true)} disabled={isPending}>
          {isPending ? "פותח סבב..." : "פתח סבב מיפוי חדש"}
        </button>

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
          קישור למורים: <code>/portal</code> (המורים מזדהים שם באמצעות תעודת זהות).
        </p>
      </div>

      <div className="page-header" style={{ marginBottom: 12 }}>
        <div className="page-header-text">
          <h2>מעקב התקדמות</h2>
        </div>
      </div>

      {!activeCampaign ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין סבב מיפוי פעיל</h3>
            <p>פתחו סבב חדש למעלה כדי להתחיל לעקוב אחר התקדמות.</p>
          </div>
        </div>
      ) : progress.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין עדיין שיוכי כיתה/מקצוע למורים</h3>
            <p>שייכו מורים לכיתות ומקצועות בעמוד המורים כדי לראות כאן מעקב.</p>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>כיתה</th>
                <th>מקצוע</th>
                <th>מורה</th>
                <th>התקדמות</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((row) => (
                <tr key={row.assignment_id}>
                  <td>
                    <span className="badge" style={{ background: `${row.class_color}22`, color: row.class_color }}>
                      <span className="badge-dot" style={{ background: row.class_color }} />
                      {row.class_name}
                    </span>
                  </td>
                  <td>{row.subject_name}</td>
                  <td>{row.teacher_name}</td>
                  <td>
                    <ProgressBadge total={row.total_students} responded={row.responded_students} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>פתיחת סבב מיפוי חדש</h2>
              <button className="modal-close" onClick={() => setConfirmOpen(false)} aria-label="סגור">
                ×
              </button>
            </div>
            <p>
              {activeCampaign
                ? "הסבב הנוכחי יושבת, וכל המורים יראו את שמות הפרמטרים החדשים ויתחילו למלא מחדש. נתוני הסבב הקודם יישמרו בהיסטוריה."
                : "ייפתח סבב מיפוי ראשון עם שמות הפרמטרים שהזנתם."}
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleStartCampaign} disabled={isPending}>
                {isPending ? "פותח..." : "אישור ופתיחה"}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
