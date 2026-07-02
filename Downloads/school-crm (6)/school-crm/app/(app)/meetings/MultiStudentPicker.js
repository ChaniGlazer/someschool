"use client";

import { useMemo, useState } from "react";

export default function MultiStudentPicker({ students, selectedIds, onChange }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedStudents = useMemo(
    () => selectedIds.map((id) => students.find((s) => s.id === id)).filter(Boolean),
    [selectedIds, students]
  );

  const filtered = useMemo(() => {
    const pool = students.filter((s) => !selectedIds.includes(s.id));
    if (!query) return pool.slice(0, 8);
    const q = query.toLowerCase();
    return pool.filter((s) => s.full_name.toLowerCase().includes(q)).slice(0, 8);
  }, [students, selectedIds, query]);

  function addStudent(id) {
    onChange([...selectedIds, id]);
    setQuery("");
    setIsPickerOpen(false);
  }

  function removeStudent(id) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {selectedStudents.map((student) => (
          <span
            key={student.id}
            className="badge"
            style={{ background: "var(--color-sage-light)", color: "var(--color-sage-dark)" }}
          >
            {student.full_name}
            <button
              type="button"
              onClick={() => removeStudent(student.id)}
              aria-label={`הסרת ${student.full_name}`}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: 13,
                padding: 0,
                marginInlineStart: 2,
              }}
            >
              ✕
            </button>
          </span>
        ))}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setIsPickerOpen((v) => !v)}
        >
          + הוספת תלמיד/ה
        </button>
      </div>

      {isPickerOpen && (
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="חיפוש תלמיד/ה לפי שם..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div
            className="card"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              left: 0,
              zIndex: 30,
              maxHeight: 220,
              overflowY: "auto",
              padding: 6,
            }}
          >
            {filtered.length === 0 && (
              <div style={{ padding: 10, color: "var(--color-text-muted)", fontSize: 13 }}>
                לא נמצאו תלמידים
              </div>
            )}
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addStudent(s.id)}
                onMouseDown={(e) => e.preventDefault()}
                className="btn-ghost"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "right",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {s.full_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
