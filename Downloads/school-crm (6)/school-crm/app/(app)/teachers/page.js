import { db } from "../../../lib/db.js";
import TeacherManager from "./TeacherManager.js";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = db.prepare("SELECT * FROM teachers ORDER BY full_name ASC").all();

  const assignmentRows = db
    .prepare(
      `SELECT ta.teacher_id, ta.class_id, c.name as class_name, c.color as class_color,
              s.name as subject_name
       FROM teacher_assignments ta
       JOIN classes c ON c.id = ta.class_id
       JOIN subjects s ON s.id = ta.subject_id
       ORDER BY c.sort_order ASC, c.name ASC, s.name ASC`
    )
    .all();

  const assignmentsByTeacher = {};
  for (const row of assignmentRows) {
    if (!assignmentsByTeacher[row.teacher_id]) assignmentsByTeacher[row.teacher_id] = [];
    assignmentsByTeacher[row.teacher_id].push({
      class_id: row.class_id,
      class_name: row.class_name,
      class_color: row.class_color,
      subject_name: row.subject_name,
    });
  }

  const teachersWithAssignments = teachers.map((t) => ({
    ...t,
    assignments: assignmentsByTeacher[t.id] || [],
  }));

  const classes = db
    .prepare("SELECT id, name FROM classes ORDER BY sort_order ASC, name ASC")
    .all();

  const subjects = db.prepare("SELECT name FROM subjects ORDER BY name ASC").all();
  const subjectNames = subjects.map((s) => s.name);

  return (
    <TeacherManager
      teachers={JSON.parse(JSON.stringify(teachersWithAssignments))}
      classes={JSON.parse(JSON.stringify(classes))}
      subjectNames={subjectNames}
    />
  );
}
