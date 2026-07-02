"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../lib/db.js";

export async function startNewCampaign(formData) {
  const param1Name = formData.get("param1Name")?.toString().trim();
  const param2Name = formData.get("param2Name")?.toString().trim();
  const param3Name = formData.get("param3Name")?.toString().trim();

  if (!param1Name || !param2Name || !param3Name) {
    return { error: "יש למלא את שלושת שמות הפרמטרים." };
  }

  db.exec("BEGIN");
  try {
    db.prepare("UPDATE mapping_campaigns SET status = 'inactive' WHERE status = 'active'").run();
    db.prepare(
      "INSERT INTO mapping_campaigns (param1_name, param2_name, param3_name, status) VALUES (?, ?, ?, 'active')"
    ).run(param1Name, param2Name, param3Name);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    return { error: "שגיאה בפתיחת סבב חדש: " + (err.message || "") };
  }

  revalidatePath("/mapping");
  return { success: true };
}
