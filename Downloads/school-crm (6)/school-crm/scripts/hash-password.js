// שימוש: node scripts/hash-password.js "הסיסמה-שלי"
// הפלט הוא ה-hash שיש להכניס למשתנה הסביבה ADMIN_PASSWORD_HASH

const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error('שימוש: node scripts/hash-password.js "הסיסמה-שלי"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nהעתק את השורה הבאה כערך של ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("");
