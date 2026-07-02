import * as XLSX from "xlsx";

export function normalizeHeader(text) {
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ");
}

export function cleanValue(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

// קורא את קובץ האקסל (תומך גם ב-.xls וגם ב-.xlsx בפועל, ללא תלות בסיומת) וממפה
// כל שורה לפי headerMap (כותרת מנורמלת -> שם שדה פנימי). זורק שגיאה אם עמודות
// חובה (requiredFields) חסרות, כדי לתת הודעה ברורה על אי-התאמת פורמט.
export function readMappedRows(buffer, headerMap, requiredFields = []) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("לא נמצא גיליון בקובץ.");
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });

  if (rows.length === 0) {
    throw new Error("הגיליון ריק.");
  }

  const headerRow = rows[0].map(normalizeHeader);
  const fieldIndexes = {};
  headerRow.forEach((header, index) => {
    const field = headerMap[header];
    if (field) fieldIndexes[field] = index;
  });

  const missingRequired = requiredFields
    .filter((f) => !(f.field in fieldIndexes))
    .map((f) => f.label);
  if (missingRequired.length > 0) {
    throw new Error(
      "מבנה הקובץ אינו תואם לפורמט הצפוי - לא נמצאו העמודות: " + missingRequired.join(", ")
    );
  }

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cleanValue(cell) !== null));

  return dataRows.map((row) => {
    const record = {};
    for (const [field, index] of Object.entries(fieldIndexes)) {
      record[field] = cleanValue(row[index]);
    }
    return record;
  });
}
