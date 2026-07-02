"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createStudent, updateStudent, deleteStudent } from "./actions.js";

function ClassBadge({ cls }) {
  if (!cls) {
    return <span className="badge" style={{ background: "#eeeade", color: "#6f7566" }}>ללא כיתה</span>;
  }
  return (
    <span className="badge" style={{ background: `${cls.color}22`, color: cls.color }}>
      <span className="badge-dot" style={{ background: cls.color }} />
      {cls.name}
    </span>
  );
}

function StudentModal({ mode, initial, classes, onClose }) {
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [tz, setTz] = useState(initial?.tz || "");
  const [classId, setClassId] = useState(initial?.class_id ? String(initial.class_id) : "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("fullName", fullName);
    formData.set("tz", tz);
    formData.set("classId", classId);
    formData.set("notes", notes);
    if (mode === "edit") formData.set("id", initial.id);

    startTransition(async () => {
      const action = mode === "edit" ? updateStudent : createStudent;
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
          <h2>{mode === "edit" ? "עריכת תלמיד" : "תלמיד חדש"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="full-name">שם התלמיד</label>
            <input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="tz">תעודת זהות</label>
              <input
                id="tz"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                inputMode="numeric"
                placeholder="9 ספרות"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="class-select">כיתה</label>
              <select
                id="class-select"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">ללא כיתה</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes">הערות (אופציונלי)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="מידע רלוונטי נוסף על התלמיד"
            />
          </div>

          <details style={{ marginBottom: 16 }} open={Boolean(initial?.phone_mobile || initial?.guardian1_name || initial?.email || initial?.city)}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-sage-dark)",
                marginBottom: 8,
              }}
            >
              פרטי קשר וכתובת {initial?.phone_mobile || initial?.guardian1_name ? "(מיובא)" : ""}
            </summary>

            <div className="form-row">
              <div className="field">
                <label htmlFor="phoneMobile">טלפון נייד</label>
                <input id="phoneMobile" name="phoneMobile" defaultValue={initial?.phone_mobile || ""} />
              </div>
              <div className="field">
                <label htmlFor="phoneHome">טלפון בית</label>
                <input id="phoneHome" name="phoneHome" defaultValue={initial?.phone_home || ""} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">דוא"ל</label>
              <input id="email" name="email" type="email" defaultValue={initial?.email || ""} />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="city">יישוב</label>
                <input id="city" name="city" defaultValue={initial?.city || ""} />
              </div>
              <div className="field">
                <label htmlFor="street">רחוב</label>
                <input id="street" name="street" defaultValue={initial?.street || ""} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="houseNumber">מס' בית</label>
                <input id="houseNumber" name="houseNumber" defaultValue={initial?.house_number || ""} />
              </div>
              <div className="field">
                <label htmlFor="birthDate">תאריך לידה</label>
                <input id="birthDate" name="birthDate" defaultValue={initial?.birth_date || ""} />
              </div>
            </div>

            <h3 style={{ fontSize: 14, margin: "16px 0 8px" }}>אפוטרופוס 1</h3>
            <div className="form-row">
              <div className="field">
                <label htmlFor="guardian1Name">שם</label>
                <input id="guardian1Name" name="guardian1Name" defaultValue={initial?.guardian1_name || ""} />
              </div>
              <div className="field">
                <label htmlFor="guardian1Relation">קרבה</label>
                <input id="guardian1Relation" name="guardian1Relation" defaultValue={initial?.guardian1_relation || ""} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="guardian1Phone">טלפון</label>
                <input id="guardian1Phone" name="guardian1Phone" defaultValue={initial?.guardian1_phone || ""} />
              </div>
              <div className="field">
                <label htmlFor="guardian1Email">דוא"ל</label>
                <input id="guardian1Email" name="guardian1Email" defaultValue={initial?.guardian1_email || ""} />
              </div>
            </div>

            <h3 style={{ fontSize: 14, margin: "16px 0 8px" }}>אפוטרופוס 2</h3>
            <div className="form-row">
              <div className="field">
                <label htmlFor="guardian2Name">שם</label>
                <input id="guardian2Name" name="guardian2Name" defaultValue={initial?.guardian2_name || ""} />
              </div>
              <div className="field">
                <label htmlFor="guardian2Relation">קרבה</label>
                <input id="guardian2Relation" name="guardian2Relation" defaultValue={initial?.guardian2_relation || ""} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="guardian2Phone">טלפון</label>
                <input id="guardian2Phone" name="guardian2Phone" defaultValue={initial?.guardian2_phone || ""} />
              </div>
              <div className="field">
                <label htmlFor="guardian2Email">דוא"ל</label>
                <input id="guardian2Email" name="guardian2Email" defaultValue={initial?.guardian2_email || ""} />
              </div>
            </div>

            {/* שדות נוספים שמיובאים אך פחות נערכים ידנית - נשמרים בעריכה כדי לא לאבד מידע */}
            <input type="hidden" name="officialName" defaultValue={initial?.official_name || ""} />
            <input type="hidden" name="isTransported" defaultValue={initial?.is_transported || ""} />
            <input type="hidden" name="neighborhood" defaultValue={initial?.neighborhood || ""} />
            <input type="hidden" name="entrance" defaultValue={initial?.entrance || ""} />
            <input type="hidden" name="apartmentNumber" defaultValue={initial?.apartment_number || ""} />
            <input type="hidden" name="zipCode" defaultValue={initial?.zip_code || ""} />
            <input type="hidden" name="poBox" defaultValue={initial?.po_box || ""} />
            <input type="hidden" name="mobileMail" defaultValue={initial?.mobile_mail || ""} />
            <input type="hidden" name="guardian1Tz" defaultValue={initial?.guardian1_tz || ""} />
            <input type="hidden" name="guardian1Address" defaultValue={initial?.guardian1_address || ""} />
            <input type="hidden" name="guardian2Tz" defaultValue={initial?.guardian2_tz || ""} />
            <input type="hidden" name="guardian2Address" defaultValue={initial?.guardian2_address || ""} />
          </details>

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

function ConfirmDeleteModal({ student, onClose }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", student.id);
    startTransition(async () => {
      await deleteStudent(formData);
      onClose();
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>מחיקת תלמיד</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>
        <p>
          למחוק את <strong>{student.full_name}</strong>? פעולה זו תמחק גם את כל
          הפניות המשויכות לתלמיד. לא ניתן לשחזר.
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

export default function StudentManager({ students, classes }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const student = students.find((s) => String(s.id) === editId);
      if (student) {
        setModal({ mode: "edit", initial: student });
        router.replace("/students");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const classById = useMemo(() => {
    const map = {};
    for (const cls of classes) map[cls.id] = cls;
    return map;
  }, [classes]);

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        !search ||
        student.full_name.toLowerCase().includes(search.toLowerCase()) ||
        student.tz.includes(search);
      const matchesClass = !classFilter || String(student.class_id) === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>תלמידים</h1>
          <p>ניהול רשימת התלמידים ושיבוצם לכיתות</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/import" className="btn btn-secondary">
            ייבוא מאקסל
          </a>
          <button className="btn btn-primary" onClick={() => setModal({ mode: "create" })}>
            + תלמיד חדש
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="חיפוש לפי שם או תעודת זהות..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">כל הכיתות</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>{students.length === 0 ? "אין עדיין תלמידים" : "לא נמצאו תלמידים"}</h3>
            <p>
              {students.length === 0
                ? "הוסף תלמיד ראשון כדי להתחיל."
                : "נסה לשנות את החיפוש או הסינון."}
            </p>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>שם התלמיד</th>
                <th>כיתה</th>
                <th>תעודת זהות</th>
                <th>טלפון</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td>{student.full_name}</td>
                  <td>
                    <ClassBadge cls={classById[student.class_id]} />
                  </td>
                  <td>{student.tz}</td>
                  <td style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                    {student.phone_mobile || student.phone_home || "-"}
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/students/${student.id}`} className="btn btn-secondary btn-sm">
                        תיק אישי
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setModal({ mode: "edit", initial: student })}
                      >
                        עריכה
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(student)}
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
        <StudentModal
          mode={modal.mode}
          initial={modal.initial}
          classes={classes}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal student={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
