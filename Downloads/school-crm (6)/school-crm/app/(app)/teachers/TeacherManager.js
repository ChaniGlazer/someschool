"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createTeacher, updateTeacher, deleteTeacher } from "./actions.js";

function AssignmentRow({ row, classes, subjectNames, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
      <select
        value={row.classId}
        onChange={(e) => onChange({ ...row, classId: e.target.value })}
        style={{ flex: 1 }}
      >
        <option value="">בחר כיתה</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
          </option>
        ))}
      </select>
      <input
        list="subjects-datalist"
        placeholder="מקצוע (למשל: מתמטיקה)"
        value={row.subjectName}
        onChange={(e) => onChange({ ...row, subjectName: e.target.value })}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onRemove}
        aria-label="הסרת שיוך"
      >
        ✕
      </button>
      <datalist id="subjects-datalist">
        {subjectNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

function TeacherModal({ mode, initial, classes, subjectNames, onClose }) {
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [tz, setTz] = useState(initial?.tz || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [assignments, setAssignments] = useState(
    initial?.assignments?.length
      ? initial.assignments.map((a) => ({ classId: String(a.class_id), subjectName: a.subject_name }))
      : []
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function addAssignmentRow() {
    setAssignments((prev) => [...prev, { classId: "", subjectName: "" }]);
  }

  function updateAssignmentRow(index, updated) {
    setAssignments((prev) => prev.map((row, i) => (i === index ? updated : row)));
  }

  function removeAssignmentRow(index) {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("tz", tz);
    formData.set("email", email);
    formData.set("phone", phone);
    formData.set("address", address);
    formData.set("notes", notes);
    formData.set(
      "assignments",
      JSON.stringify(assignments.filter((a) => a.classId && a.subjectName.trim()))
    );
    if (mode === "edit") formData.set("id", initial.id);

    startTransition(async () => {
      const action = mode === "edit" ? updateTeacher : createTeacher;
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>{mode === "edit" ? "עריכת מורה" : "מורה חדש/ה"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="teacher-name">שם המורה</label>
            <input
              id="teacher-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label htmlFor="teacher-tz">תעודת זהות (לכניסה לפורטל המורים)</label>
            <input
              id="teacher-tz"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              inputMode="numeric"
              placeholder="9 ספרות - אופציונלי"
            />
            <span className="field-hint">
              נדרש כדי שהמורה יוכל להיכנס לפורטל המורים ולמלא מיפוי תלמידים.
            </span>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="teacher-phone">טלפון</label>
              <input id="teacher-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="teacher-email">דוא"ל</label>
              <input
                id="teacher-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="teacher-address">כתובת</label>
            <input id="teacher-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="teacher-notes">הערות (אופציונלי)</label>
            <textarea id="teacher-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="field">
            <label>כיתות ומקצועות</label>
            {assignments.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>
                עדיין לא נוספו שיוכים לכיתה/מקצוע.
              </p>
            )}
            {assignments.map((row, index) => (
              <AssignmentRow
                key={index}
                row={row}
                classes={classes}
                subjectNames={subjectNames}
                onChange={(updated) => updateAssignmentRow(index, updated)}
                onRemove={() => removeAssignmentRow(index)}
              />
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addAssignmentRow}>
              + הוספת שיוך כיתה/מקצוע
            </button>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "שומר..." : "שמירה"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ teacher, onClose }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", teacher.id);
    startTransition(async () => {
      await deleteTeacher(formData);
      onClose();
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>מחיקת מורה</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>
        <p>
          למחוק את <strong>{teacher.full_name}</strong>? כל שיוכי הכיתה/מקצוע שלו יימחקו
          גם הם. לא ניתן לשחזר.
        </p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={handleDelete} disabled={isPending}>
            {isPending ? "מוחק..." : "מחיקה"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherManager({ teachers, classes, subjectNames }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const teacher = teachers.find((t) => String(t.id) === editId);
      if (teacher) {
        setModal({ mode: "edit", initial: teacher });
        router.replace("/teachers");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!search) return teachers;
    const q = search.toLowerCase();
    return teachers.filter((t) => t.full_name.toLowerCase().includes(q));
  }, [teachers, search]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>מורים</h1>
          <p>ניהול צוות ההוראה ושיוך לכיתות ומקצועות</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: "create" })}>
          + מורה חדש/ה
        </button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="חיפוש לפי שם..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>{teachers.length === 0 ? "אין עדיין מורים" : "לא נמצאו מורים"}</h3>
            <p>{teachers.length === 0 ? "הוסיפו מורה ראשון כדי להתחיל." : "נסו לשנות את החיפוש."}</p>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>שם המורה</th>
                <th>כיתות ומקצועות</th>
                <th>טלפון</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.full_name}</td>
                  <td style={{ fontSize: 13 }}>
                    {teacher.assignments.length === 0 ? (
                      <span style={{ color: "var(--color-text-muted)" }}>ללא שיוך</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {teacher.assignments.map((a) => (
                          <span
                            key={`${a.class_id}-${a.subject_name}`}
                            className="badge"
                            style={{ background: `${a.class_color}22`, color: a.class_color }}
                          >
                            {a.subject_name} · {a.class_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                    {teacher.phone || "-"}
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/teachers/${teacher.id}`} className="btn btn-secondary btn-sm">
                        תיק אישי
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setModal({ mode: "edit", initial: teacher })}
                      >
                        עריכה
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(teacher)}
                      >
                        מחיקה
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <TeacherModal
          mode={modal.mode}
          initial={modal.initial}
          classes={classes}
          subjectNames={subjectNames}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal teacher={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
