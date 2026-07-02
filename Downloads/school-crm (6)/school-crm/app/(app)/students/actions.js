"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../../lib/db.js";
import { isValidIsraeliId, normalizeIsraeliId } from "../../../lib/validators.js";

const EXTRA_FIELDS = [
  "officialName",
  "birthDate",
  "isTransported",
  "city",
  "neighborhood",
  "street",
  "houseNumber",
  "entrance",
  "apartmentNumber",
  "zipCode",
  "poBox",
  "mobileMail",
  "phoneMobile",
  "phoneHome",
  "email",
  "guardian1Name",
  "guardian1Tz",
  "guardian1Relation",
  "guardian1Phone",
  "guardian1Address",
  "guardian1Email",
  "guardian2Name",
  "guardian2Tz",
  "guardian2Relation",
  "guardian2Phone",
  "guardian2Address",
  "guardian2Email",
];

const COLUMN_BY_FIELD = {
  officialName: "official_name",
  birthDate: "birth_date",
  isTransported: "is_transported",
  city: "city",
  neighborhood: "neighborhood",
  street: "street",
  houseNumber: "house_number",
  entrance: "entrance",
  apartmentNumber: "apartment_number",
  zipCode: "zip_code",
  poBox: "po_box",
  mobileMail: "mobile_mail",
  phoneMobile: "phone_mobile",
  phoneHome: "phone_home",
  email: "email",
  guardian1Name: "guardian1_name",
  guardian1Tz: "guardian1_tz",
  guardian1Relation: "guardian1_relation",
  guardian1Phone: "guardian1_phone",
  guardian1Address: "guardian1_address",
  guardian1Email: "guardian1_email",
  guardian2Name: "guardian2_name",
  guardian2Tz: "guardian2_tz",
  guardian2Relation: "guardian2_relation",
  guardian2Phone: "guardian2_phone",
  guardian2Address: "guardian2_address",
  guardian2Email: "guardian2_email",
};

function readExtraFields(formData) {
  const values = {};
  for (const field of EXTRA_FIELDS) {
    values[field] = formData.get(field)?.toString().trim() || null;
  }
  return values;
}

export async function createStudent(formData) {
  const fullName = formData.get("fullName")?.toString().trim();
  const tzRaw = formData.get("tz")?.toString().trim();
  const classId = formData.get("classId")?.toString();
  const notes = formData.get("notes")?.toString().trim() || null;
  const extra = readExtraFields(formData);

  if (!fullName) return { error: "יש להזין שם תלמיד." };
  if (!tzRaw) return { error: "יש להזין תעודת זהות." };
  if (!isValidIsraeliId(tzRaw)) return { error: "תעודת הזהות אינה תקינה." };

  const tz = normalizeIsraeliId(tzRaw);

  const extraColumns = EXTRA_FIELDS.map((f) => COLUMN_BY_FIELD[f]);
  const columns = ["full_name", "tz", "class_id", "notes", ...extraColumns];
  const placeholders = columns.map(() => "?").join(", ");
  const values = [
    fullName,
    tz,
    classId ? Number(classId) : null,
    notes,
    ...EXTRA_FIELDS.map((f) => extra[f]),
  ];

  try {
    db.prepare(`INSERT INTO students (${columns.join(", ")}) VALUES (${placeholders})`).run(
      ...values
    );
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { error: "תלמיד עם תעודת זהות זו כבר קיים במערכת." };
    }
    return { error: "שגיאה בשמירת התלמיד." };
  }

  revalidatePath("/students");
  revalidatePath("/inquiries");
  return { success: true };
}

export async function updateStudent(formData) {
  const id = Number(formData.get("id"));
  const fullName = formData.get("fullName")?.toString().trim();
  const tzRaw = formData.get("tz")?.toString().trim();
  const classId = formData.get("classId")?.toString();
  const notes = formData.get("notes")?.toString().trim() || null;
  const extra = readExtraFields(formData);

  if (!id) return { error: "נתונים חסרים." };
  if (!fullName) return { error: "יש להזין שם תלמיד." };
  if (!tzRaw) return { error: "יש להזין תעודת זהות." };
  if (!isValidIsraeliId(tzRaw)) return { error: "תעודת הזהות אינה תקינה." };

  const tz = normalizeIsraeliId(tzRaw);

  const extraColumns = EXTRA_FIELDS.map((f) => COLUMN_BY_FIELD[f]);
  const setClause = ["full_name = ?", "tz = ?", "class_id = ?", "notes = ?"]
    .concat(extraColumns.map((col) => `${col} = ?`))
    .join(", ");
  const values = [
    fullName,
    tz,
    classId ? Number(classId) : null,
    notes,
    ...EXTRA_FIELDS.map((f) => extra[f]),
    id,
  ];

  try {
    db.prepare(`UPDATE students SET ${setClause} WHERE id = ?`).run(...values);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return { error: "תלמיד עם תעודת זהות זו כבר קיים במערכת." };
    }
    return { error: "שגיאה בעדכון התלמיד." };
  }

  revalidatePath("/students");
  revalidatePath("/inquiries");
  return { success: true };
}

export async function deleteStudent(formData) {
  const id = Number(formData.get("id"));
  if (!id) return { error: "נתונים חסרים." };

  db.prepare("DELETE FROM students WHERE id = ?").run(id);

  revalidatePath("/students");
  revalidatePath("/inquiries");
  return { success: true };
}
