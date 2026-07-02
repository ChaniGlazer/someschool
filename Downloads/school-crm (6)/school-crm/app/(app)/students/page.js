import { db } from "../../../lib/db.js";
import StudentManager from "./StudentManager.js";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = JSON.parse(
    JSON.stringify(db.prepare("SELECT * FROM students ORDER BY full_name ASC").all())
  );

  const classes = JSON.parse(
    JSON.stringify(
      db.prepare("SELECT * FROM classes ORDER BY sort_order ASC, name ASC").all()
    )
  );

  return <StudentManager students={students} classes={classes} />;
}
