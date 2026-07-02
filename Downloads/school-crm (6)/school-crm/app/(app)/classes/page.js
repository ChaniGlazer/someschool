import { db } from "../../../lib/db.js";
import ClassManager from "./ClassManager.js";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const classes = JSON.parse(
    JSON.stringify(
      db.prepare("SELECT * FROM classes ORDER BY sort_order ASC, name ASC").all()
    )
  );

  const counts = db
    .prepare(
      "SELECT class_id, COUNT(*) as count FROM students WHERE class_id IS NOT NULL GROUP BY class_id"
    )
    .all();

  const studentCounts = {};
  for (const row of counts) {
    studentCounts[row.class_id] = row.count;
  }

  return <ClassManager classes={classes} studentCounts={studentCounts} />;
}
