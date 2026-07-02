"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  createInquiry,
  updateInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from "./actions.js";

const COLUMNS = [
  { key: "new", title: "חדש" },
  { key: "in_progress", title: "בטיפול" },
  { key: "done", title: "טופל" },
];

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

function StudentPicker({ students, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = students.find((s) => s.id === value);

  const filtered = useMemo(() => {
    if (!query) return students.slice(0, 8);
    const q = query.toLowerCase();
    return students.filter((s) => s.full_name.toLowerCase().includes(q)).slice(0, 8);
  }, [students, query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="חפש תלמיד לפי שם..."
        value={open ? query : selected?.full_name || query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
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
              onClick={() => {
                onChange(s.id);
                setQuery("");
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "right",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="btn-ghost"
            >
              <span
                className="badge-dot"
                style={{ background: s.class_color || "#ccc", flexShrink: 0 }}
              />
              {s.full_name}
              {s.class_name && (
                <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                  ({s.class_name})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryModal({ mode, initial, students, onClose }) {
  const [studentId, setStudentId] = useState(initial?.student_id || null);
  const [subject, setSubject] = useState(initial?.subject || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [priority, setPriority] = useState(initial?.priority || "normal");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("studentId", studentId || "");
    formData.set("subject", subject);
    formData.set("description", description);
    formData.set("priority", priority);
    if (mode === "edit") formData.set("id", initial.id);

    startTransition(async () => {
      const action = mode === "edit" ? updateInquiry : createInquiry;
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", initial.id);
    startTransition(async () => {
      await deleteInquiry(formData);
      onClose();
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "edit" ? "עריכת פנייה" : "פנייה חדשה"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>תלמיד/ה</label>
            <StudentPicker students={students} value={studentId} onChange={setStudentId} />
          </div>

          <div className="field">
            <label htmlFor="subject">נושא הפנייה</label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="לדוגמה: קושי חברתי בכיתה"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="description">תיאור</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים על הפנייה"
            />
          </div>

          <div className="field">
            <label htmlFor="priority">עדיפות</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">נמוכה</option>
              <option value="normal">רגילה</option>
              <option value="urgent">דחופה</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "שומר..." : "שמירה"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ביטול
            </button>
            {mode === "edit" && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isPending}
              >
                מחיקה
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function InquiryCard({ inquiry, onOpen, onDragStart, isDragging }) {
  return (
    <div
      className={`kanban-card${isDragging ? " kanban-card-dragging" : ""}`}
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
    >
      <div className="kanban-card-student">
        <span
          className="badge-dot"
          style={{ background: inquiry.class_color || "#ccc", flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{inquiry.student_name}</span>
        {inquiry.class_name && (
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {inquiry.class_name}
          </span>
        )}
      </div>
      <div className="kanban-card-subject">{inquiry.subject}</div>
      {inquiry.description && (
        <div className="kanban-card-desc">{inquiry.description}</div>
      )}
      <div className="kanban-card-footer">
        <span className={`badge badge-priority-${inquiry.priority}`}>
          {PRIORITY_LABELS[inquiry.priority] || inquiry.priority}
        </span>
        <span className="kanban-card-date">{formatDate(inquiry.created_at)}</span>
      </div>
    </div>
  );
}

export default function KanbanBoard({ inquiries, students }) {
  const [modal, setModal] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const newForStudent = searchParams.get("newForStudent");
    if (newForStudent) {
      const studentId = Number(newForStudent);
      if (students.some((s) => s.id === studentId)) {
        setModal({ mode: "create", initial: { student_id: studentId } });
      }
      router.replace("/inquiries");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const columns = useMemo(() => {
    const grouped = { new: [], in_progress: [], done: [] };
    for (const inquiry of inquiries) {
      (grouped[inquiry.status] || grouped.new).push(inquiry);
    }
    return grouped;
  }, [inquiries]);

  function handleDrop(statusKey) {
    setDragOverColumn(null);
    if (draggingId == null) return;
    const formData = new FormData();
    formData.set("id", draggingId);
    formData.set("status", statusKey);
    startTransition(async () => {
      await updateInquiryStatus(formData);
    });
    setDraggingId(null);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>פניות</h1>
          <p>לוח פניות ליועץ - גררו כרטיס בין העמודות לעדכון סטטוס</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModal({ mode: "create" })}
          disabled={students.length === 0}
          title={students.length === 0 ? "יש להוסיף תלמידים לפני יצירת פנייה" : undefined}
        >
          + פנייה חדשה
        </button>
      </div>

      {students.length === 0 && (
        <div className="alert alert-error">
          יש להוסיף לפחות תלמיד אחד לפני יצירת פנייה. עברו לעמוד התלמידים.
        </div>
      )}

      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`kanban-column${dragOverColumn === col.key ? " kanban-column-dragover" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(col.key);
            }}
            onDragLeave={() => setDragOverColumn((cur) => (cur === col.key ? null : cur))}
            onDrop={() => handleDrop(col.key)}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-title">{col.title}</span>
              <span className="kanban-column-count">{columns[col.key].length}</span>
            </div>
            <div className="kanban-cards">
              {columns[col.key].map((inquiry) => (
                <InquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  isDragging={draggingId === inquiry.id}
                  onDragStart={() => setDraggingId(inquiry.id)}
                  onOpen={() => setModal({ mode: "edit", initial: inquiry })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <InquiryModal
          mode={modal.mode}
          initial={modal.initial}
          students={students}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
