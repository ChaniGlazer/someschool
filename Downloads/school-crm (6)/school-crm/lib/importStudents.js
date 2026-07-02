import { isValidIsraeliId, normalizeIsraeliId } from "./validators.js";
import { readMappedRows } from "./xlsxUtils.js";

// מיפוי כותרות עמודות (כפי שמופיעות בקובץ אלפון תלמידים) לשמות שדות פנימיים.
// המפתחות מנורמלים: טרים + כיווץ רווחים כפולים לרווח בודד.
const HEADER_MAP = {
  "מס'": "serial",
  "שם תלמיד": "full_name",
  "ת.לידה": "birth_date",
  'ת.ז. תלמיד': "tz",
  "כיתת אם": "class_name",
  רחוב: "street",
  "מס' בית": "house_number",
  כניסה: "entrance",
  "מס' דירה": "apartment_number",
  מיקוד: "zip_code",
  "דואר נע": "mobile_mail",
  "ת.ד": "po_box",
  שכונה: "neighborhood",
  "תאור ישוב": "city",
  "טלפון בית": "phone_home",
  "טלפון נייד": "phone_mobile",
  'דוא"ל': "email",
  "סוג קרבה אפוטרופוס 1": "guardian1_relation",
  "מספר זהות אפוטרופוס 1": "guardian1_tz",
  "שם אפוטרופוס 1": "guardian1_name",
  "טל' אפוטרופוס 1": "guardian1_phone",
  "כתובת אפוטרופוס 1": "guardian1_address",
  'דוא"ל אפוטרופוס 1': "guardian1_email",
  "סוג קרבה אפוטרופוס 2": "guardian2_relation",
  "מספר זהות אפוטרופוס 2": "guardian2_tz",
  "שם אפוטרופוס 2": "guardian2_name",
  "טל' אפוטרופוס 2": "guardian2_phone",
  "כתובת אפוטרופוס 2": "guardian2_address",
  'דוא"ל אפוטרופוס 2': "guardian2_email",
  "האם מוסע": "is_transported",
  "שם רשמי": "official_name",
};

const REQUIRED_FIELDS = [
  { field: "full_name", label: "שם תלמיד" },
  { field: "tz", label: "ת.ז. תלמיד" },
];

// קורא את קובץ האקסל (תומך גם ב-.xls וגם ב-.xlsx בפועל, ללא תלות בסיומת)
// ומחזיר מערך שורות גולמיות ממופות לפי HEADER_MAP.
export function parseWorkbook(buffer) {
  return readMappedRows(buffer, HEADER_MAP, REQUIRED_FIELDS);
}

// בונה תצוגה מקדימה מלאה: מיפוי שם כיתה לכיתה קיימת, זיהוי כפילויות, ולידציה בסיסית.
export function buildPreview(records, { classNameToId, existingTzToId }) {
  const seenTz = new Set();

  return records.map((record, index) => {
    const issues = [];
    let willImport = true;

    const fullName = record.full_name;
    if (!fullName) {
      issues.push("שם תלמיד חסר - השורה לא תיובא");
      willImport = false;
    }

    const rawTz = record.tz;
    let tz = null;
    if (!rawTz) {
      issues.push("תעודת זהות חסרה - השורה לא תיובא");
      willImport = false;
    } else {
      tz = normalizeIsraeliId(rawTz.replace(/\D/g, ""));
      if (!/^\d{9}$/.test(tz)) {
        issues.push("תעודת זהות אינה בפורמט תקין - השורה לא תיובא");
        willImport = false;
      } else if (!isValidIsraeliId(tz)) {
        issues.push("תעודת זהות לא עברה בדיקת ביקורת (ייתכן ותקינה בכל זאת)");
      }
    }

    if (tz && willImport) {
      if (seenTz.has(tz)) {
        issues.push("תעודת זהות כפולה בתוך הקובץ - רק המופע הראשון יובא");
        willImport = false;
      } else {
        seenTz.add(tz);
      }
    }

    let classId = null;
    const className = record.class_name;
    if (className) {
      const match = classNameToId[className];
      if (match) {
        classId = match;
      } else {
        issues.push(`כיתה לא מוכרת במערכת: "${className}" - התלמיד ייובא ללא שיוך לכיתה`);
      }
    }

    const isUpdate = tz ? Boolean(existingTzToId[tz]) : false;

    return {
      rowIndex: index + 2, // מספר שורה באקסל (1 = כותרות)
      full_name: fullName,
      official_name: record.official_name,
      tz,
      class_name: className,
      class_id: classId,
      birth_date: record.birth_date,
      is_transported: record.is_transported,
      city: record.city,
      neighborhood: record.neighborhood,
      street: record.street,
      house_number: record.house_number,
      entrance: record.entrance,
      apartment_number: record.apartment_number,
      zip_code: record.zip_code,
      po_box: record.po_box,
      mobile_mail: record.mobile_mail,
      phone_mobile: record.phone_mobile,
      phone_home: record.phone_home,
      email: record.email,
      guardian1_name: record.guardian1_name,
      guardian1_tz: record.guardian1_tz,
      guardian1_relation: record.guardian1_relation,
      guardian1_phone: record.guardian1_phone,
      guardian1_address: record.guardian1_address,
      guardian1_email: record.guardian1_email,
      guardian2_name: record.guardian2_name,
      guardian2_tz: record.guardian2_tz,
      guardian2_relation: record.guardian2_relation,
      guardian2_phone: record.guardian2_phone,
      guardian2_address: record.guardian2_address,
      guardian2_email: record.guardian2_email,
      status: !willImport ? "error" : isUpdate ? "update" : "create",
      issues,
      willImport,
    };
  });
}

export const STUDENT_IMPORT_FIELDS = [
  "full_name",
  "official_name",
  "tz",
  "class_id",
  "birth_date",
  "is_transported",
  "city",
  "neighborhood",
  "street",
  "house_number",
  "entrance",
  "apartment_number",
  "zip_code",
  "po_box",
  "mobile_mail",
  "phone_mobile",
  "phone_home",
  "email",
  "guardian1_name",
  "guardian1_tz",
  "guardian1_relation",
  "guardian1_phone",
  "guardian1_address",
  "guardian1_email",
  "guardian2_name",
  "guardian2_tz",
  "guardian2_relation",
  "guardian2_phone",
  "guardian2_address",
  "guardian2_email",
];
