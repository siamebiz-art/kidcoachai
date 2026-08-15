/** อายุในหน่วยเดือน — ใช้สำหรับ filter เกมตามวัย */
export function calculateAgeMonths(birthdate: string): number {
  if (!birthdate) return 60; // default 5 ปี ถ้าไม่รู้อายุ
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return 60;
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth())
    - (now.getDate() < birth.getDate() ? 1 : 0);
  return Math.max(0, months);
}

export function calculateAge(birthdate: string): string {
  if (!birthdate) return "";
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return "";
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) { years--; months += 12; }
  }
  if (years <= 0) return `${Math.max(months, 0)} เดือน`;
  if (months === 0) return `${years} ปี`;
  return `${years} ปี ${months} เดือน`;
}

export function getScoreStatus(score: number) {
  if (score >= 75) return { label: "ดี", color: "text-green-600" };
  if (score >= 50) return { label: "พอใช้", color: "text-amber-600" };
  return { label: "ควรฝึกเพิ่ม", color: "text-red-500" };
}

export const DIAGNOSIS_OPTIONS = [
  { key: "speech_delay", label: "พูดช้า" },
  { key: "autism", label: "ออทิสติก (ASD)" },
  { key: "adhd", label: "สมาธิสั้น (ADHD)" },
  { key: "down_syndrome", label: "ดาวน์ซินโดรม" },
  { key: "global_delay", label: "พัฒนาการช้าโดยรวม" },
  { key: "other", label: "อื่นๆ" },
];

export const DAY_KEYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export const DAY_NAMES_TH: Record<string, string> = {
  monday: "จันทร์",
  tuesday: "อังคาร",
  wednesday: "พุธ",
  thursday: "พฤหัส",
  friday: "ศุกร์",
  saturday: "เสาร์",
  sunday: "อาทิตย์",
};

export const DAY_SHORT_TH = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
