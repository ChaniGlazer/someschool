import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// תיקיית הנתונים - ב-Render יש להגדיר DATA_DIR לנתיב של Persistent Disk
export const DATA_DIR = process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "crm.db");

let _db = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// עמודות פרופיל מורחבות לתלמיד (נוספו עבור יבוא מאקסל, אך זמינות גם לעריכה ידנית)
const STUDENT_PROFILE_COLUMNS = [
  ["official_name", "TEXT"],
  ["birth_date", "TEXT"],
  ["is_transported", "TEXT"],
  ["city", "TEXT"],
  ["neighborhood", "TEXT"],
  ["street", "TEXT"],
  ["house_number", "TEXT"],
  ["entrance", "TEXT"],
  ["apartment_number", "TEXT"],
  ["zip_code", "TEXT"],
  ["po_box", "TEXT"],
  ["mobile_mail", "TEXT"],
  ["phone_mobile", "TEXT"],
  ["phone_home", "TEXT"],
  ["email", "TEXT"],
  ["guardian1_name", "TEXT"],
  ["guardian1_tz", "TEXT"],
  ["guardian1_relation", "TEXT"],
  ["guardian1_phone", "TEXT"],
  ["guardian1_address", "TEXT"],
  ["guardian1_email", "TEXT"],
  ["guardian2_name", "TEXT"],
  ["guardian2_tz", "TEXT"],
  ["guardian2_relation", "TEXT"],
  ["guardian2_phone", "TEXT"],
  ["guardian2_address", "TEXT"],
  ["guardian2_email", "TEXT"],
];

function migrateStudentColumns(database) {
  const existing = database.prepare("PRAGMA table_info(students)").all();
  const existingNames = new Set(existing.map((col) => col.name));

  for (const [name, type] of STUDENT_PROFILE_COLUMNS) {
    if (!existingNames.has(name)) {
      database.exec(`ALTER TABLE students ADD COLUMN ${name} ${type};`);
    }
  }
}

function migrateTeacherColumns(database) {
  const existing = database.prepare("PRAGMA table_info(teachers)").all();
  const existingNames = new Set(existing.map((col) => col.name));
  if (!existingNames.has("tz")) {
    database.exec("ALTER TABLE teachers ADD COLUMN tz TEXT;");
    // אינדקס ייחודי חלקי - כמה מורים יכולים להיות בלי ת.ז (NULL), אבל אם יש ת.ז היא חייבת להיות ייחודית
    database.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_tz ON teachers(tz) WHERE tz IS NOT NULL;"
    );
  }
}

function initSchema(database) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#8a9a8e',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      tz TEXT NOT NULL UNIQUE,
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, class_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_date TEXT NOT NULL,
      title TEXT NOT NULL,
      participants TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meeting_students (
      meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      PRIMARY KEY (meeting_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS meeting_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mapping_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      param1_name TEXT NOT NULL,
      param2_name TEXT NOT NULL,
      param3_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mapping_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL REFERENCES mapping_campaigns(id) ON DELETE CASCADE,
      assignment_id INTEGER NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      score1 INTEGER,
      score2 INTEGER,
      score3 INTEGER,
      note TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(campaign_id, assignment_id, student_id)
    );

    CREATE INDEX IF NOT EXISTS idx_mapping_responses_assignment ON mapping_responses(assignment_id);
    CREATE INDEX IF NOT EXISTS idx_mapping_responses_campaign ON mapping_responses(campaign_id);

    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_student ON inquiries(student_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
    CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
    CREATE INDEX IF NOT EXISTS idx_meeting_students_student ON meeting_students(student_id);
    CREATE INDEX IF NOT EXISTS idx_meeting_attachments_meeting ON meeting_attachments(meeting_id);
  `);

  migrateStudentColumns(database);
  migrateTeacherColumns(database);
}

// יוצר את החיבור למסד הנתונים רק כשבאמת צריך אותו (לא בזמן build)
function getDb() {
  if (_db) return _db;

  // בזמן `next build` אין צורך וגם אין אפשרות בטוחה לפתוח את הקובץ - חוסם זאת
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "אין לגשת למסד הנתונים בזמן שלב הבנייה (build). קריאה זו בוצעה בטעות מתוך קוד שרץ ב-build time."
    );
  }

  ensureDataDir();
  _db = new DatabaseSync(DB_PATH);
  initSchema(_db);
  return _db;
}

// Proxy עצלן - מבטיח שה-DB לא נפתח עד לקריאה ראשונה בפועל (runtime), לא ב-build
export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const real = getDb();
      const value = real[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
  }
);
