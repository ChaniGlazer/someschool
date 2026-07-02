import { NextResponse } from "next/server";
import { db } from "../../../../lib/db.js";
import { STUDENT_IMPORT_FIELDS } from "../../../../lib/importStudents.js";

const UPSERT_SQL = `
  INSERT INTO students (
    full_name, tz, class_id, official_name, birth_date, is_transported, city, neighborhood,
    street, house_number, entrance, apartment_number, zip_code, po_box, mobile_mail,
    phone_mobile, phone_home, email,
    guardian1_name, guardian1_tz, guardian1_relation, guardian1_phone, guardian1_address, guardian1_email,
    guardian2_name, guardian2_tz, guardian2_relation, guardian2_phone, guardian2_address, guardian2_email
  ) VALUES (
    @full_name, @tz, @class_id, @official_name, @birth_date, @is_transported, @city, @neighborhood,
    @street, @house_number, @entrance, @apartment_number, @zip_code, @po_box, @mobile_mail,
    @phone_mobile, @phone_home, @email,
    @guardian1_name, @guardian1_tz, @guardian1_relation, @guardian1_phone, @guardian1_address, @guardian1_email,
    @guardian2_name, @guardian2_tz, @guardian2_relation, @guardian2_phone, @guardian2_address, @guardian2_email
  )
  ON CONFLICT(tz) DO UPDATE SET
    full_name = excluded.full_name,
    class_id = excluded.class_id,
    official_name = excluded.official_name,
    birth_date = excluded.birth_date,
    is_transported = excluded.is_transported,
    city = excluded.city,
    neighborhood = excluded.neighborhood,
    street = excluded.street,
    house_number = excluded.house_number,
    entrance = excluded.entrance,
    apartment_number = excluded.apartment_number,
    zip_code = excluded.zip_code,
    po_box = excluded.po_box,
    mobile_mail = excluded.mobile_mail,
    phone_mobile = excluded.phone_mobile,
    phone_home = excluded.phone_home,
    email = excluded.email,
    guardian1_name = excluded.guardian1_name,
    guardian1_tz = excluded.guardian1_tz,
    guardian1_relation = excluded.guardian1_relation,
    guardian1_phone = excluded.guardian1_phone,
    guardian1_address = excluded.guardian1_address,
    guardian1_email = excluded.guardian1_email,
    guardian2_name = excluded.guardian2_name,
    guardian2_tz = excluded.guardian2_tz,
    guardian2_relation = excluded.guardian2_relation,
    guardian2_phone = excluded.guardian2_phone,
    guardian2_address = excluded.guardian2_address,
    guardian2_email = excluded.guardian2_email
`;

function toParams(row) {
  const params = {};
  for (const field of STUDENT_IMPORT_FIELDS) {
    params[field] = row[field] ?? null;
  }
  return params;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }

  const rows = Array.isArray(body?.rows) ? body.rows : [];
  const importable = rows.filter((r) => r?.willImport && r?.tz && r?.full_name);

  if (importable.length === 0) {
    return NextResponse.json({ error: "אין שורות תקינות לייבוא." }, { status: 400 });
  }

  const existingBefore = db.prepare("SELECT tz FROM students").all();
  const existingTzSet = new Set(existingBefore.map((r) => r.tz));

  const stmt = db.prepare(UPSERT_SQL);

  let created = 0;
  let updated = 0;

  db.exec("BEGIN");
  try {
    for (const row of importable) {
      const params = toParams(row);
      stmt.run(params);
      if (existingTzSet.has(row.tz)) {
        updated += 1;
      } else {
        created += 1;
        existingTzSet.add(row.tz);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    return NextResponse.json(
      { error: "שגיאה בשמירת הנתונים: " + (err.message || "") },
      { status: 500 }
    );
  }

  return NextResponse.json({ created, updated, skipped: rows.length - importable.length });
}
