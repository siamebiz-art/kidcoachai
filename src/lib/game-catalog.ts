/**
 * ทะเบียนเกมทั้งหมดใน Kido Universe™
 * minAgeMonths / maxAgeMonths อ้างอิงงานวิจัย Piaget, NAEYC
 */
export interface GameEntry {
  id: string;
  href: string;
  emoji: string;
  title: string;
  desc: string;
  /** อายุน้อยสุด (เดือน) ที่เหมาะกับเกมนี้ */
  minAgeMonths: number;
  /** อายุมากสุดที่ยังเหมาะ (เดือน) — ไม่ lock แต่ใช้สำหรับ UX hint */
  maxAgeMonths: number;
  /**
   * true = ต้องอ่านออก — ซ่อนเกมนี้จากเด็กที่อายุน้อยกว่า 54 เดือน
   * แม้จะอยู่ในสถานะ "unlock-soon"
   */
  requiresReading?: boolean;
}

export const GAME_CATALOG: GameEntry[] = [
  // ── เกมก่อนอ่านหนังสือ (2-5 ขวบ) ──────────────────────────────────────────
  { id: "listen-point",  href: "/dashboard/listen-point",  emoji: "👂", title: "ฟังแล้วชี้",          desc: "Kido พูด แตะรูปถูก · 6 หมวด",   minAgeMonths: 24, maxAgeMonths: 66  },
  { id: "body-tap",      href: "/dashboard/body-tap",      emoji: "🧩", title: "ประกอบร่างกาย",        desc: "ชี้อวัยวะ · ประกอบคนให้ครบ",      minAgeMonths: 24, maxAgeMonths: 72  },
  { id: "count-it",      href: "/dashboard/count-it",      emoji: "🔢", title: "นับจำนวน",             desc: "นับของ 1-15 · แตะเลขที่ถูก",      minAgeMonths: 24, maxAgeMonths: 72  },
  { id: "thai-alpha",    href: "/dashboard/thai-alpha",    emoji: "ก",  title: "ทาย ก ข ค",           desc: "ฟังชื่อตัวอักษร · แตะตัวที่ถูก",  minAgeMonths: 36, maxAgeMonths: 84  },
  { id: "eng-alpha",     href: "/dashboard/eng-alpha",     emoji: "🔤", title: "ทาย A B C",           desc: "ฟัง A-Z · แตะตัวอักษรอังกฤษ",     minAgeMonths: 36, maxAgeMonths: 84  },
  { id: "animal-guess",  href: "/dashboard/animal-guess",  emoji: "🐾", title: "ทายรูปสัตว์",          desc: "จำชื่อสัตว์ 40+ ชนิด",             minAgeMonths: 36, maxAgeMonths: 84  },
  { id: "animal-riddle", href: "/dashboard/animal-riddle", emoji: "🎭", title: "อะไรเอ่ย?",            desc: "ปริศนาสัตว์ไทย 16 ชนิด",           minAgeMonths: 48, maxAgeMonths: 96  },
  { id: "jigsaw",        href: "/dashboard/jigsaw",        emoji: "🧩", title: "ต่อจิ๊กซอ",             desc: "วางชิ้นส่วน · ต่อภาพให้ครบ",       minAgeMonths: 24, maxAgeMonths: 84  },

  // ── เกม AI ทุกวัย ────────────────────────────────────────────────────────────
  { id: "story",         href: "/dashboard/story",         emoji: "📖", title: "นิทาน AI",             desc: "ฟังนิทานออกเสียง",                 minAgeMonths: 24, maxAgeMonths: 144 },
  { id: "kido",          href: "/dashboard/kido",          emoji: "🎮", title: "เล่นกับ Kido",         desc: "เกมฝึกทักษะ 20+ เกม",              minAgeMonths: 24, maxAgeMonths: 144 },
  { id: "eq-coach",      href: "/dashboard/eq-coach",      emoji: "💛", title: "ฝึก EQ",               desc: "รู้จักอารมณ์ตัวเอง",               minAgeMonths: 36, maxAgeMonths: 144 },
  { id: "life-skills",   href: "/dashboard/life-skills",   emoji: "🌟", title: "ทักษะชีวิต",           desc: "ภารกิจประจำวัน",                   minAgeMonths: 36, maxAgeMonths: 144 },
  { id: "social-skills", href: "/dashboard/social-skills", emoji: "🤝", title: "ทักษะสังคม",           desc: "ฝึกการเข้าสังคม",                  minAgeMonths: 48, maxAgeMonths: 144 },
  { id: "creativity",    href: "/dashboard/creativity",    emoji: "🎨", title: "ความคิดสร้างสรรค์",    desc: "วาด + สร้างตัวละคร",               minAgeMonths: 48, maxAgeMonths: 144 },

  // ── เกมอ่านเขียน (5+ ขวบ) — ซ่อนจากเด็กที่ยังอ่านไม่ออก ──────────────────
  { id: "reading-coach",  href: "/dashboard/reading-coach",  emoji: "🗣️", title: "ฝึกอ่านออกเสียง",   desc: "ไทย / อังกฤษ",              minAgeMonths: 60, maxAgeMonths: 120, requiresReading: true },
  { id: "spelling-coach", href: "/dashboard/spelling-coach", emoji: "🔡", title: "ฝึกสะกดคำ",          desc: "ไทย / อังกฤษ",              minAgeMonths: 60, maxAgeMonths: 120, requiresReading: true },
  { id: "learning",       href: "/dashboard/learning",       emoji: "🎓", title: "ช่วยการบ้าน",        desc: "ถามได้ทุกวิชา",             minAgeMonths: 60, maxAgeMonths: 144, requiresReading: true },
  { id: "word-search",    href: "/dashboard/word-search",    emoji: "🔍", title: "Word Search",         desc: "หาคำศัพท์ 8 หมวด",         minAgeMonths: 66, maxAgeMonths: 144, requiresReading: true },
  { id: "exam-prep",      href: "/dashboard/exam-prep",      emoji: "📝", title: "เตรียมสอบ",          desc: "Quiz + สรุปบทเรียน",        minAgeMonths: 72, maxAgeMonths: 144, requiresReading: true },

  // ── เมนูคงที่ (ทุกวัย) ──────────────────────────────────────────────────────
  { id: "activities",    href: "/dashboard/activities",    emoji: "📚", title: "กิจกรรมทั้งหมด",     desc: "แผนฝึกรายวัน",              minAgeMonths: 0,  maxAgeMonths: 144 },
  { id: "ai-coach",      href: "/dashboard/ai-coach",      emoji: "🤖", title: "AI ที่ปรึกษา",       desc: "ถามผู้เชี่ยวชาญ",           minAgeMonths: 0,  maxAgeMonths: 144 },
];
