import { readMappedRows } from "./xlsxUtils.js";
import { isValidIsraeliId } from "./validators.js";

// מיפוי כותרות גמיש - קבצי אלפון מורים משתנים בין מערכות בתי ספר שונות,
// אז נתמוך בכמה ניסוחים נפוצים לכל שדה.
const HEADER_MAP = {
  "שם מורה": "full_name",
  שם: "full_name",
  "שם מלא": "full_name",
  'ת"ז': "tz",
  "ת.ז": "tz",
  "תעודת זהות": "tz",
  מייל: "email",
  'דוא"ל': "email",
  "דואר אלקטרוני": "email",
  טלפון: "phone",
  "מספר טלפון": "phone",
  נייד: "phone",
  "טלפון נייד": "phone",
  כתובת: "address",
  כיתה: "class_name",
  "כיתת אם": "class_name",
  מקצוע: "subject_name",
};

const REQUIRED_FIELDS = [{ field: "full_name", label: "שם מורה" }];

export function parseWorkbook(buffer) {
  return readMappedRows(buffer, HEADER_MAP, REQUIRED_FIELDS);
}

// ממזג שורות של אותו מורה (המופיע כמה פעמים - פעם לכל שילוב כיתה/מקצוע)
// לרשומה אחת עם רשימת שיוכים. מפתח המיזוג: ת.ז אם קיימת, אחרת דוא"ל, אחרת שם מלא.
export function buildTeacherPreview(records, { classNameToId, existingTeacherKeyToId }) {
  const merged = new Map(); // key -> { fullName, tz, email, phone, address, assignments: [], rowIndexes: [] }

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const fullName = record.full_name;
    if (!fullName) return; // מטופל כשגיאה למטה

    const key = (record.tz || record.email || fullName).trim().toLowerCase();

    if (!merged.has(key)) {
      merged.set(key, {
        key,
        fullName,
        tz: record.tz || null,
        email: record.email || null,
        phone: record.phone || null,
        address: record.address || null,
        assignments: [],
        rowIndexes: [],
        issues: [],
      });
    }

    const entry = merged.get(key);
    entry.rowIndexes.push(rowNumber);
    // אם שורה מאוחרת יותר מכילה פרטי קשר שלא היו קודם, נשלים אותם
    entry.tz = entry.tz || record.tz || null;
    entry.email = entry.email || record.email || null;
    entry.phone = entry.phone || record.phone || null;
    entry.address = entry.address || record.address || null;

    if (record.tz) {
      const digits = record.tz.replace(/\D/g, "");
      if (!digits || digits.length > 9) {
        entry.issues.push(`שורה ${rowNumber}: תעודת הזהות אינה בפורמט תקין - לא נשמרה`);
      } else if (!isValidIsraeliId(digits)) {
        entry.issues.push(
          `שורה ${rowNumber}: תעודת הזהות לא עברה בדיקת ביקורת (ייתכן ותקינה בכל זאת)`
        );
      }
    }

    const className = record.class_name;
    const subjectName = record.subject_name;

    if (className && subjectName) {
      const classId = classNameToId[className] || null;
      if (!classId) {
        entry.issues.push(`כיתה לא מוכרת במערכת: "${className}" (שורה ${rowNumber}) - השיוך דולג`);
      } else {
        const alreadyExists = entry.assignments.some(
          (a) => a.classId === classId && a.subjectName === subjectName
        );
        if (!alreadyExists) {
          entry.assignments.push({ classId, className, subjectName });
        }
      }
    } else if (className || subjectName) {
      entry.issues.push(
        `שורה ${rowNumber}: יש כיתה או מקצוע בלבד (חסר האחר) - השיוך דולג`
      );
    }
  });

  const missingNameCount = records.filter((r) => !r.full_name).length;

  const rows = Array.from(merged.values()).map((entry) => {
    const isUpdate = Boolean(existingTeacherKeyToId[entry.key]);
    return {
      key: entry.key,
      full_name: entry.fullName,
      tz: entry.tz,
      email: entry.email,
      phone: entry.phone,
      address: entry.address,
      assignments: entry.assignments,
      rowIndexes: entry.rowIndexes,
      status: isUpdate ? "update" : "create",
      issues: entry.issues,
      willImport: true,
    };
  });

  return { rows, missingNameCount };
}
