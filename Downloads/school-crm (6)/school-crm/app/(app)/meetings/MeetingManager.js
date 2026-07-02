"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MultiStudentPicker from "./MultiStudentPicker.js";
import RichTextEditor from "./RichTextEditor.js";
import AttachmentUploader from "./AttachmentUploader.js";

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function MeetingModal({ mode, initial, students, onClose, onSaved }) {
  const [meetingDate, setMeetingDate] = useState(initial?.meeting_date || todayIso());
  const [studentIds, setStudentIds] = useState(initial?.studentIds || []);
  const [participants, setParticipants] = useState(initial?.participants || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [summary, setSummary] = useState(initial?.summary || "");
  const [attachments, setAttachments] = useState(initial?.attachments || []);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!meetingDate) return setError("יש להזין תאריך פגישה.");
    if (!title.trim()) return setError("יש להזין כותרת לפגישה.");

    setIsSaving(true);
    try {
      const payload = {
        meetingDate,
        title: title.trim(),
        participants: participants.trim(),
        summary,
        studentIds,
      };

      let meetingId = initial?.id;

      if (mode === "edit") {
        const res = await fetch(`/api/meetings/${meetingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בעדכון הפגישה.");
      } else {
        const res = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בשמירת הפגישה.");
        meetingId = data.id;
      }

      if (pendingFiles.length > 0) {
        const formData = new FormData();
        for (const file of pendingFiles) formData.append("files", file);
        const uploadRes = await fetch(`/api/meetings/${meetingId}/attachments`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error || "הפגישה נשמרה אך העלאת הקבצים נכשלה.");
        }
      }

      onSaved();
    } catch (err) {
      setError(err.message || "שגיאה לא צפויה.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/meetings/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "שגיאה במחיקת הפגישה.");
      }
      onSaved();
    } catch (err) {
      setError(err.message || "שגיאה לא צפויה.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2>{mode === "edit" ? "עריכת סיכום פגישה" : "סיכום פגישה חדש"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="סגור">
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="meeting-date">תאריך הפגישה *</label>
            <input
              id="meeting-date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>תלמידים</label>
            <MultiStudentPicker
              students={students}
              selectedIds={studentIds}
              onChange={setStudentIds}
            />
          </div>

          <div className="field">
            <label htmlFor="meeting-participants">משתתפים</label>
            <input
              id="meeting-participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="לדוגמה: מחנכת הכיתה, הורי התלמיד"
            />
          </div>

          <div className="field">
            <label htmlFor="meeting-title">כותרת הפגישה *</label>
            <input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>סיכום פגישה</label>
            <RichTextEditor value={summary} onChange={setSummary} placeholder="כתבו כאן את סיכום הפגישה..." />
          </div>

          <div className="field">
            <label>קבצים מצורפים</label>
            <AttachmentUploader
              meetingId={mode === "edit" ? initial.id : null}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              pendingFiles={pendingFiles}
              onPendingFilesChange={setPendingFiles}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving || isDeleting}>
              {isSaving ? "שומר..." : "שמירה"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ביטול
            </button>
            {mode === "edit" && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? "מוחק..." : "מחיקת פגישה"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MeetingManager({ meetings, students }) {
  const [modal, setModal] = useState(null);
  const router = useRouter();

  const studentById = useMemo(() => {
    const map = {};
    for (const s of students) map[s.id] = s;
    return map;
  }, [students]);

  function refresh() {
    setModal(null);
    router.refresh();
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>פגישות</h1>
          <p>תיעוד וסיכום פגישות עם תלמידים</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModal({ mode: "create" })}
          disabled={students.length === 0}
          title={students.length === 0 ? "יש להוסיף תלמידים תחילה" : undefined}
        >
          + סיכום פגישה חדש
        </button>
      </div>

      {students.length === 0 && (
        <div className="alert alert-error">יש להוסיף לפחות תלמיד אחד לפני יצירת פגישה.</div>
      )}

      {meetings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>אין עדיין פגישות מתועדות</h3>
            <p>לחצו על "סיכום פגישה חדש" כדי להתחיל.</p>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>כותרת</th>
                <th>תלמידים</th>
                <th>משתתפים</th>
                <th>קבצים</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDisplayDate(meeting.meeting_date)}</td>
                  <td>{meeting.title}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {meeting.studentIds.map((id) =>
                        studentById[id] ? (
                          <span key={id} className="badge badge-priority-low">
                            {studentById[id].full_name}
                          </span>
                        ) : null
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    {meeting.participants || "-"}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    {meeting.attachments.length > 0 ? `${meeting.attachments.length} קבצים` : "-"}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          setModal({
                            mode: "edit",
                            initial: meeting,
                          })
                        }
                      >
                        עריכה
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
        <MeetingModal
          mode={modal.mode}
          initial={modal.initial}
          students={students}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
