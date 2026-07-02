"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_LABELS = {
  create: { label: "חדש", className: "badge-priority-low" },
  update: { label: "עדכון", className: "badge-priority-normal" },
};

function StatusBadge({ status }) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.create;
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

export default function TeacherImportWizard() {
  const [step, setStep] = useState("upload");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);

  const summary = preview?.summary;

  async function handleFileSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const file = form.elements.namedItem("file").files?.[0];
    if (!file) {
      setError("יש לבחור קובץ אקסל.");
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/import/teachers/parse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "שגיאה בניתוח הקובץ.");
        setIsLoading(false);
        return;
      }

      setPreview(data);
      setSelected(new Set(data.rows.map((r) => r.key)));
      setStep("preview");
    } catch {
      setError("שגיאה בתקשורת עם השרת. נסו שוב.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleRow(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleConfirm() {
    if (!preview) return;
    setIsLoading(true);
    setError("");

    const rowsToImport = preview.rows.filter((r) => selected.has(r.key));

    try {
      const res = await fetch("/api/import/teachers/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rowsToImport }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "שגיאה בייבוא הנתונים.");
        setIsLoading(false);
        return;
      }

      setResult(data);
      setStep("done");
    } catch {
      setError("שגיאה בתקשורת עם השרת. נסו שוב.");
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setStep("upload");
    setPreview(null);
    setSelected(new Set());
    setResult(null);
    setError("");
    setFileName("");
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      {step === "upload" && (
        <div className="card card-pad">
          <h2 style={{ marginBottom: 10 }}>העלאת קובץ מורים</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 10 }}>
            עמודות נתמכות (בכל ניסוח נפוץ): שם מורה, ת.ז, מייל, טלפון, כתובת, כיתה, מקצוע.
            ת.ז נדרשת כדי שהמורה יוכל להיכנס לפורטל המורים - אם היא לא כלולה בקובץ, ניתן
            להוסיף אותה ידנית מאוחר יותר בעמוד המורים. אם למורה יש כמה שילובי כיתה/מקצוע, הם
            יכולים להופיע בכמה שורות עם אותו שם/ת.ז/מייל - המערכת תאחד אותן אוטומטית לתיק
            מורה אחד עם כל השיוכים.
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 20 }}>
            שימו לב: מבנה קובץ מורים משתנה בין מערכות בתי ספר - אם הקובץ שלכם לא זוהה נכון,
            שתפו אותו כדי שנתאים את מיפוי העמודות בדיוק אליו.
          </p>
          <form onSubmit={handleFileSubmit}>
            <div className="field">
              <label htmlFor="teacher-file">קובץ אקסל</label>
              <input id="teacher-file" name="file" type="file" accept=".xls,.xlsx" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "מנתח קובץ..." : "נתח קובץ"}
            </button>
          </form>
        </div>
      )}

      {step === "preview" && preview && (
        <>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <span className="badge badge-priority-low">חדשים: {summary.toCreate}</span>
              <span className="badge badge-priority-normal">עדכונים: {summary.toUpdate}</span>
              <span className="badge" style={{ background: "#eeeade", color: "#6f7566" }}>
                אזהרות: {summary.warnings}
              </span>
              {summary.skippedMissingName > 0 && (
                <span className="badge badge-priority-urgent">
                  דולגו (חסר שם): {summary.skippedMissingName}
                </span>
              )}
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>קובץ: {fileName}</p>
          </div>

          <div className="card table-wrap" style={{ marginBottom: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>שם מורה</th>
                  <th>ת.ז</th>
                  <th>טלפון</th>
                  <th>דוא"ל</th>
                  <th>שיוכים</th>
                  <th>סטטוס</th>
                  <th>הערות</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(row.key)}
                        onChange={() => toggleRow(row.key)}
                      />
                    </td>
                    <td>{row.full_name}</td>
                    <td>{row.tz || "-"}</td>
                    <td>{row.phone || "-"}</td>
                    <td>{row.email || "-"}</td>
                    <td style={{ fontSize: 13 }}>
                      {row.assignments.length === 0
                        ? "-"
                        : row.assignments.map((a) => `${a.subjectName} (${a.className})`).join(", ")}
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td style={{ fontSize: 12, color: "var(--color-text-muted)", maxWidth: 220 }}>
                      {row.issues.join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={isLoading || selected.size === 0}
            >
              {isLoading ? "מייבא..." : `ייבוא ${selected.size} מורים`}
            </button>
            <button className="btn btn-secondary" onClick={reset} disabled={isLoading}>
              העלאת קובץ אחר
            </button>
          </div>
        </>
      )}

      {step === "done" && result && (
        <div className="card card-pad">
          <h2 style={{ marginBottom: 10 }}>הייבוא הושלם</h2>
          <p style={{ marginBottom: 20 }}>
            נוצרו <strong>{result.created}</strong> מורים חדשים, עודכנו{" "}
            <strong>{result.updated}</strong> מורים קיימים, נוספו{" "}
            <strong>{result.assignmentsAdded}</strong> שיוכי כיתה/מקצוע.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/teachers" className="btn btn-primary">
              מעבר לרשימת המורים
            </Link>
            <button className="btn btn-secondary" onClick={reset}>
              ייבוא קובץ נוסף
            </button>
          </div>
        </div>
      )}
    </>
  );
}
