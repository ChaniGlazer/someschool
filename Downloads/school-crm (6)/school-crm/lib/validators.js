// אימות מספר תעודת זהות ישראלית באמצעות אלגוריתם ה-checksum הרשמי
export function isValidIsraeliId(rawId) {
  const id = String(rawId || "").trim();
  if (!/^\d{1,9}$/.test(id)) return false;

  const padded = id.padStart(9, "0");
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let digit = Number(padded[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }

  return sum % 10 === 0;
}

export function normalizeIsraeliId(rawId) {
  const id = String(rawId || "").trim();
  if (!/^\d{1,9}$/.test(id)) return id;
  return id.padStart(9, "0");
}
