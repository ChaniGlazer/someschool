import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db.js";
import { saveMeetingAttachment } from "../../../../../lib/uploads.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB לכל קובץ

export async function POST(request, { params }) {
  const { id } = await params;
  const meetingId = Number(id);
  if (!meetingId) return NextResponse.json({ error: "פגישה לא נמצאה." }, { status: 400 });

  const meeting = db.prepare("SELECT id FROM meetings WHERE id = ?").get(meetingId);
  if (!meeting) return NextResponse.json({ error: "פגישה לא נמצאה." }, { status: 404 });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "לא ניתן לקרוא את הבקשה." }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f) => typeof f?.arrayBuffer === "function");
  if (files.length === 0) {
    return NextResponse.json({ error: "לא נבחר קובץ." }, { status: 400 });
  }

  const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
  if (oversized) {
    return NextResponse.json(
      { error: `הקובץ "${oversized.name}" גדול מדי (מקסימום 20MB לקובץ).` },
      { status: 400 }
    );
  }

  const insert = db.prepare(
    `INSERT INTO meeting_attachments (meeting_id, original_name, stored_name, mime_type, size)
     VALUES (?, ?, ?, ?, ?)`
  );

  const created = [];
  for (const file of files) {
    const saved = await saveMeetingAttachment(file);
    const result = insert.run(meetingId, saved.originalName, saved.storedName, saved.mimeType, saved.size);
    created.push({
      id: Number(result.lastInsertRowid),
      original_name: saved.originalName,
      stored_name: saved.storedName,
      mime_type: saved.mimeType,
      size: saved.size,
    });
  }

  return NextResponse.json({ attachments: created });
}
