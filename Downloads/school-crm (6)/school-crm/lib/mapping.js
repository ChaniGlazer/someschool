// 4 הרמות הקבועות למילוי מהיר בפורטל המורים - סדר תצוגה מהטוב לגרוע, לפי המפרט
export const MAPPING_LEVELS = [
  { value: 4, label: "מעל הממוצע", color: "#4d8a5e" },
  { value: 3, label: "בממוצע", color: "#6f8b74" },
  { value: 2, label: "מתחת לממוצע", color: "#c98f39" },
  { value: 1, label: "קושי משמעותי", color: "#b6503f" },
];

export function getLevelInfo(value) {
  return MAPPING_LEVELS.find((l) => l.value === value) || null;
}
