"use client";

import { useMemo, useState } from "react";
import { MAPPING_LEVELS } from "../../../../../lib/mapping.js";

function buildInitialState(students, responses) {
  const byStudent = {};
  for (const r of responses) {
    byStudent[r.student_id] = {
      score1: r.score1 ?? null,
      score2: r.score2 ?? null,
      score3: r.score3 ?? null,
      note: r.note || "",
      saved: true,
    };
  }
  for (const s of students) {
    if (!byStudent[s.id]) {
      byStudent[s.id] = { score1: null, score2: null, score3: null, note: "", saved: false };
    }
  }
  return byStudent;
}

function Pill({ level, isSelected, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`matrix-pill${isSelected ? " matrix-pill-selected" : ""}`}
      style={isSelected ? { background: level.color } : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {level.label}
    </button>
  );
}

export default function MatrixTable({ assignmentId, campaignId, campaignParams, students, initialResponses }) {
  const [rows, setRows] = useState(() => buildInitialState(students, initialResponses));
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");

  const scoreFields = useMemo(() => ["score1", "score2", "score3"], []);

  async function saveField(studentId, field, value) {
    const key = `${studentId}-${field}`;
    setSavingKey(key);
    setError("");

    // עדכון אופטימי - חיווי מיידי, גם לפני תגובת השרת
    setRows((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));

    try {
      const res = await fetch("/api/portal/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, campaignId, studentId, field, value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "שגיאה בשמירה");
      }
      setRows((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], saved: true },
      }));
    } catch (err) {
      setError(`שגיאה בשמירת הנתון עבור תלמיד/ה: ${err.message}`);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card matrix-table-wrap">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>תלמיד/ה</th>
              {campaignParams.map((name, i) => (
                <th key={i}>{name}</th>
              ))}
              <th>הערה</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const row = rows[student.id];
              return (
                <tr key={student.id}>
                  <td>
                    <span className="matrix-student-name">
                      {student.full_name}
                      {row.saved && (
                        <span className="matrix-saved-check" title="נשמר">
                          ✓
                        </span>
                      )}
                    </span>
                  </td>
                  {scoreFields.map((field) => (
                    <td key={field}>
                      <div className="matrix-pills">
                        {MAPPING_LEVELS.map((level) => (
                          <Pill
                            key={level.value}
                            level={level}
                            isSelected={row[field] === level.value}
                            disabled={savingKey === `${student.id}-${field}`}
                            onClick={() => saveField(student.id, field, level.value)}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                  <td>
                    <input
                      type="text"
                      className="matrix-note-input"
                      defaultValue={row.note}
                      placeholder="הערה חופשית"
                      onBlur={(e) => saveField(student.id, "note", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
