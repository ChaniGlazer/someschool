import { db } from "../../../lib/db.js";
import MeetingManager from "./MeetingManager.js";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const meetings = db
    .prepare("SELECT * FROM meetings ORDER BY meeting_date DESC, id DESC")
    .all();

  const meetingStudentRows = db.prepare("SELECT meeting_id, student_id FROM meeting_students").all();
  const attachmentRows = db
    .prepare(
      "SELECT id, meeting_id, original_name, stored_name, mime_type, size FROM meeting_attachments"
    )
    .all();

  const studentsByMeeting = {};
  for (const row of meetingStudentRows) {
    if (!studentsByMeeting[row.meeting_id]) studentsByMeeting[row.meeting_id] = [];
    studentsByMeeting[row.meeting_id].push(row.student_id);
  }

  const attachmentsByMeeting = {};
  for (const row of attachmentRows) {
    if (!attachmentsByMeeting[row.meeting_id]) attachmentsByMeeting[row.meeting_id] = [];
    attachmentsByMeeting[row.meeting_id].push({
      id: row.id,
      original_name: row.original_name,
      stored_name: row.stored_name,
      mime_type: row.mime_type,
      size: row.size,
    });
  }

  const meetingsWithRelations = meetings.map((m) => ({
    ...m,
    studentIds: studentsByMeeting[m.id] || [],
    attachments: attachmentsByMeeting[m.id] || [],
  }));

  const students = db
    .prepare("SELECT id, full_name FROM students ORDER BY full_name ASC")
    .all();

  return (
    <MeetingManager
      meetings={JSON.parse(JSON.stringify(meetingsWithRelations))}
      students={JSON.parse(JSON.stringify(students))}
    />
  );
}
