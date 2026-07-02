"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../lib/db.js";
import { DEFAULT_CLASS_COLOR } from "../../../lib/colors.js";

export async function createClass(formData) {
  const name = formData.get("name")?.toString().trim();
  const color = formData.get("color")?.toString().trim() || DEFAULT_CLASS_COLOR;

  if (!name) {
    return { error: "יש להזין שם כיתה." };
  }

  try {
    db.prepare("INSERT INTO classes (name, color, sort_order) VALUES (?, ?, ?)").run(
      name,
      color,
      Date.now()
    );
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { error: "כיתה בשם הזה כבר קיימת." };
    }
    return { error: "שגיאה ביצירת הכיתה." };
  }

  revalidatePath("/classes");
  revalidatePath("/students");
  return { success: true };
}

export async function updateClass(formData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name")?.toString().trim();
  const color = formData.get("color")?.toString().trim() || DEFAULT_CLASS_COLOR;

  if (!id || !name) {
    return { error: "נתונים חסרים." };
  }

  try {
    db.prepare("UPDATE classes SET name = ?, color = ? WHERE id = ?").run(name, color, id);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { error: "כיתה בשם הזה כבר קיימת." };
    }
    return { error: "שגיאה בעדכון הכיתה." };
  }

  revalidatePath("/classes");
  revalidatePath("/students");
  return { success: true };
}

export async function deleteClass(formData) {
  const id = Number(formData.get("id"));
  if (!id) return { error: "נתונים חסרים." };

  db.prepare("UPDATE students SET class_id = NULL WHERE class_id = ?").run(id);
  db.prepare("DELETE FROM classes WHERE id = ?").run(id);

  revalidatePath("/classes");
  revalidatePath("/students");
  return { success: true };
}
