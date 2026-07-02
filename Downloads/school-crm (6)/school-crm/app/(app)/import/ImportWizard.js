"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const STATUS_LABELS = {
  create: { label: "חדש", className: "badge-priority-low" },
  update: { label: "עדכון", className: "badge-priority-normal" },
  error: { label: "שגיאה", className: "badge-priority-urgent" },
};

function StatusBadge({ status }) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.create;
  return <span className={`badge ${info.className}`}>{info.label}</span>;
}

export default function ImportWizard() {
  const [step, setStep] = useState("upload");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // { rows, summary }
  const [selected, setSelected] = useState(new Set());
  const [result, setResult] = useState(null);

  const summary = preview?.summary;

  const rowsWithIssuesFirst = useMemo(() => {
    if (!preview) return [];
    return preview.rows;
  }, [preview]);

  async function handleFileSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file");
    const file = fileInput.files?.[0];
    if (!file) {
      setError("יש לבחור קובץ אקסל.");
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/import/parse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "שגיאה בניתוח הקובץ.");
        setIsLoading(false);
        return;
      }

      setPreview(data);
      setSelected(new Set(data.rows.filter((r) => r.willImport).map((r) => r.rowIndex)));
      setStep("preview");
    } catch {
      setError("שגיאה בתקשורת עם השרת. נסו שוב.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleRow(rowIndex) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  async function handleConfirm() {
    if (!preview) return;
    setIsLoading(true);
    setError("");

    const rowsToImport = preview.rows
      .filter((r) => r.willImport && selected.has(r.rowIndex))
      .map((r) => ({ ...r }));

    try {
      const res = await fetch("/api/import/confirm", {
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
          <h2 style={{ marginBottom: 10 }}>העלאת קובץ</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
            בחרו את קובץ האלפון (.xls או .xlsx) כפי שיוצא ממערכת בית הספר. המערכת תזהה
            אוטומטית את התלמידים, פרטי הקשר של ההורים, ותנסה לשייך כל תלמיד לכיתה קיימת
            לפי עמודת "כיתת אם". תלמידים עם ת.ז שכבר קיימת במערכת יעודכנו, לא ישוכפלו.
          </p>
          <form onSubmit={handleFileSubmit}>
            <div className="field">
              <label htmlFor="file">קובץ אקסל</label>
              <input id="file" name="file" type="file" accept=".xls,.xlsx" required />
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
              <span className="badge badge-priority-urgent">שגיאות: {summary.errors}</span>
              <span className="badge" style={{ background: "#eeeade", color: "#6f7566" }}>
                אזהרות: {summary.warnings}
              </span>
              <span className="badge" style={{ background: "#eeeade", color: "#6f7566" }}>
                סה"כ שורות: {summary.total}
              </span>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              קובץ: {fileName}. שורות עם שגיאה (מסומנות באדום) לא ניתנות לייבוא ולא ייכללו.
              ניתן לבטל סימון של שורות נוספות שלא לרצות לייבא.
            </p>
          </div>

          <div className="card table-wrap" style={{ marginBottom: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>שורה</th>
                  <th>שם תלמיד</th>
                  <th>ת.ז</th>
                  <th>כיתה</th>
                  <th>הורה 1</th>
                  <th>סטטוס</th>
                  <th>הערות</th>
                </tr>
              </thead>
              <tbody>
                {rowsWithIssuesFirst.map((row) => {
                  const isChecked = selected.has(row.rowIndex);
                  return (
                    <tr
                      key={row.rowIndex}
                      style={row.status === "error" ? { opacity: 0.55 } : undefined}
                    >
                      <td>
                        {row.willImport && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(row.rowIndex)}
                          />
                        )}
                      </td>
                      <td>{row.rowIndex}</td>
                      <td>{row.full_name || "-"}</td>
                      <td>{row.tz || "-"}</td>
                      <td>
                        {row.class_id ? (
                          row.class_name
                        ) : row.class_name ? (
                          <span style={{ color: "var(--color-danger)" }}>{row.class_name} ⚠</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>ללא כיתה</span>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>{row.guardian1_name || "-"}</td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={{ fontSize: 12, color: "var(--color-text-muted)", maxWidth: 260 }}>
                        {row.issues.join(" · ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={isLoading || selected.size === 0}
            >
              {isLoading ? "מייבא..." : `ייבוא ${selected.size} תלמידים`}
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
            נוצרו <strong>{result.created}</strong> תלמידים חדשים, עודכנו{" "}
            <strong>{result.updated}</strong> תלמידים קיימים
            {result.skipped > 0 && <> ({result.skipped} שורות דולגו עקב שגיאות)</>}.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/students" className="btn btn-primary">
              מעבר לרשימת התלמידים
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
