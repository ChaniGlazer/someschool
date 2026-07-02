import { db } from "../../../lib/db.js";
import MappingDashboard from "./MappingDashboard.js";

export const dynamic = "force-dynamic";

export default async function MappingPage() {
  const activeCampaign = db
    .prepare("SELECT * FROM mapping_campaigns WHERE status = 'active' ORDER BY id DESC LIMIT 1")
    .get();

  let progress = [];
  if (activeCampaign) {
    progress = db
      .prepare(
        `SELECT
           ta.id as assignment_id,
           t.full_name as teacher_name,
           c.name as class_name,
           c.color as class_color,
           s.name as subject_name,
           (SELECT COUNT(*) FROM students WHERE class_id = ta.class_id) as total_students,
           (SELECT COUNT(DISTINCT student_id) FROM mapping_responses
              WHERE assignment_id = ta.id AND campaign_id = ?
                AND (score1 IS NOT NULL OR score2 IS NOT NULL OR score3 IS NOT NULL OR note IS NOT NULL)
           ) as responded_students
         FROM teacher_assignments ta
         JOIN teachers t ON t.id = ta.teacher_id
         JOIN classes c ON c.id = ta.class_id
         JOIN subjects s ON s.id = ta.subject_id
         ORDER BY c.sort_order ASC, c.name ASC, s.name ASC, t.full_name ASC`
      )
      .all(activeCampaign.id);
  }

  return (
    <MappingDashboard
      activeCampaign={activeCampaign ? JSON.parse(JSON.stringify(activeCampaign)) : null}
      progress={JSON.parse(JSON.stringify(progress))}
    />
  );
}
