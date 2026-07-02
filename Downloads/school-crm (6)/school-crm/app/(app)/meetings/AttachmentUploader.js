"use client";

import { useRef, useState } from "react";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentUploader({
  meetingId,
  attachments,
  onAttachmentsChange,
  pendingFiles,
  onPendingFilesChange,
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError("");

    if (!meetingId) {
      // מצב יצירה - עדיין אין מזהה פגישה, שומרים מקומית עד לשמירת הפגישה עצמה
      onPendingFilesChange([...pendingFiles, ...files]);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      const res = await fetch(`/api/meetings/${meetingId}/attachments`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהעלאת הקובץ.");
      } else {
        onAttachmentsChange([...attachments, ...data.attachments]);
      }
    } catch {
      setError("שגיאה בתקשורת עם השרת.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveExisting(attachmentId) {
    setError("");
    try {
      const res = await fetch(`/api/meetings/attachments/${attachmentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "שגיאה במחיקת הקובץ.");
        return;
      }
      onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
    } catch {
      setError("שגיאה בתקשורת עם השרת.");
    }
  }

  function handleRemovePending(index) {
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        className={`dropzone${isDragActive ? " dropzone-active" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {isUploading ? "מעלה קובץ..." : "גררו קובץ לכאן או לחצו לבחירה"}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}

      {(attachments.length > 0 || pendingFiles.length > 0) && (
        <div style={{ marginTop: 12 }}>
          {attachments.map((a) => (
            <div key={a.id} className="attachment-chip">
              <a href={`/api/meetings/files/${a.stored_name}`} target="_blank" rel="noreferrer">
                {a.original_name}
              </a>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--color-text-muted)" }}>{formatSize(a.size)}</span>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleRemoveExisting(a.id)}
                  aria-label={`מחיקת ${a.original_name}`}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
          {pendingFiles.map((file, index) => (
            <div key={`pending-${index}`} className="attachment-chip">
              <span>{file.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--color-text-muted)" }}>{formatSize(file.size)}</span>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleRemovePending(index)}
                  aria-label={`הסרת ${file.name}`}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
