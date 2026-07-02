"use client";

import { useState, useTransition } from "react";
import { createClass, updateClass, deleteClass } from "./actions.js";
import { CLASS_COLORS, DEFAULT_CLASS_COLOR } from "../../../lib/colors.js";

function ColorPicker({ value, onChange }) {
  return (
    <div className="color-grid">
      {CLASS_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch${value === color ? " color-swatch-selected" : ""}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={`בחר צבע ${color}`}
        />
      ))}
    </div>
  );
}

function ClassModal({ mode, initial, onClose }) {
  const [name, setName] = useState(initial?.name || "");
  const [color, setColor] = useState(initial?.color || DEFAULT_CLASS_COLOR);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", color);
    if (mode === "edit") formData.set("id", initial.id);

    startTransition(async () => {
      const action = mode === "edit" ? updateClass : createClass;
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "edit" ? "עריכת כיתה" : "כיתה חדשה"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="class-name">שם הכיתה</label>
            <input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: ז׳3"
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label>צבע לזיהוי הכיתה</label>
            <ColorPicker value={color} onChange={setColor} />
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

function ConfirmDeleteModal({ cls, onClose }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", cls.id);
    startTransition(async () => {
      await deleteClass(formData);
      onClose();
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>מחיקת כיתה</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>
        <p>
          למחוק את הכיתה <strong>{cls.name}</strong>? תלמידים המשויכים לכיתה זו
          יישארו במערכת אך יוצגו ללא כיתה.
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

export default function ClassManager({ classes, studentCounts }) {
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', initial }
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>כיתות</h1>
          <p>הגדרת רשימת הכיתות והצבע המזהה של כל כיתה</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: "create" })}>
          + כיתה חדשה
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין עדיין כיתות</h3>
            <p>הוסף כיתה ראשונה כדי להתחיל לשבץ תלמידים.</p>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>כיתה</th>
                <th>מספר תלמידים</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>
                    <span className="badge" style={{ background: `${cls.color}22`, color: cls.color }}>
                      <span className="badge-dot" style={{ background: cls.color }} />
                      {cls.name}
                    </span>
                  </td>
                  <td>{studentCounts[cls.id] || 0}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setModal({ mode: "edit", initial: cls })}
                      >
                        עריכה
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(cls)}
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
        <ClassModal mode={modal.mode} initial={modal.initial} onClose={() => setModal(null)} />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal cls={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
