import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db.js";
import { deleteMeetingAttachmentFile } from "../../../../../lib/uploads.js";

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const attachmentId = Number(id);
  if (!attachmentId) return NextResponse.json({ error: "נתונים חסרים." }, { status: 400 });

  const attachment = db
    .prepare("SELECT stored_name FROM meeting_attachments WHERE id = ?")
    .get(attachmentId);

  if (!attachment) {
    return NextResponse.json({ error: "קובץ לא נמצא." }, { status: 404 });
  }

  db.prepare("DELETE FROM meeting_attachments WHERE id = ?").run(attachmentId);
  deleteMeetingAttachmentFile(attachment.stored_name);

  return NextResponse.json({ success: true });
}
