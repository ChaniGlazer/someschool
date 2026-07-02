import { db } from "../../../lib/db.js";
import KanbanBoard from "./KanbanBoard.js";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const inquiries = JSON.parse(
    JSON.stringify(
      db
        .prepare(
          `SELECT
             i.id, i.subject, i.description, i.priority, i.status, i.created_at, i.updated_at,
             s.id as student_id, s.full_name as student_name,
             c.id as class_id, c.name as class_name, c.color as class_color
           FROM inquiries i
           JOIN students s ON s.id = i.student_id
           LEFT JOIN classes c ON c.id = s.class_id
           ORDER BY i.created_at DESC`
        )
        .all()
    )
  );

  const students = JSON.parse(
    JSON.stringify(
      db
        .prepare(
          `SELECT s.id, s.full_name, c.name as class_name, c.color as class_color
           FROM students s
           LEFT JOIN classes c ON c.id = s.class_id
           ORDER BY s.full_name ASC`
        )
        .all()
    )
  );

  return <KanbanBoard inquiries={inquiries} students={students} />;
}
