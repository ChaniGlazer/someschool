import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db.js";
import { readMeetingAttachment } from "../../../../../lib/uploads.js";

export async function GET(_request, { params }) {
  const { filename } = await params;

  const record = db
    .prepare("SELECT original_name, mime_type FROM meeting_attachments WHERE stored_name = ?")
    .get(filename);

  if (!record) {
    return NextResponse.json({ error: "קובץ לא נמצא." }, { status: 404 });
  }

  const buffer = readMeetingAttachment(filename);
  if (!buffer) {
    return NextResponse.json({ error: "קובץ לא נמצא בדיסק." }, { status: 404 });
  }

  const encodedName = encodeURIComponent(record.original_name || filename);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": record.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
