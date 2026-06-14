// Shared helpers for Kido Healthy Screen Time™ daily tracking

export interface DailyData {
  date: string;
  screenMinutes: number;
  physicalMinutes: number;
  readingMinutes: number;
  parentMinutes: number;
  completedMissions: string[];
}

export interface Mission {
  id: string;
  emoji: string;
  title: string;
  category: "physical" | "parent" | "reading";
  minutes: number;
}

export const OFFLINE_MISSIONS: Mission[] = [
  { id: "jump10",     emoji: "🏃", title: "กระโดด 10 ครั้ง!",                category: "physical", minutes: 3 },
  { id: "hug",        emoji: "🤗", title: "กอดคุณพ่อหรือคุณแม่ 1 ครั้ง",     category: "parent",   minutes: 5 },
  { id: "redThings",  emoji: "🔍", title: "หาของสีแดงในบ้านมา 3 อย่าง",      category: "physical", minutes: 5 },
  { id: "clap10",     emoji: "👏", title: "ตบมือ 10 ครั้งพร้อมยิ้ม!",         category: "physical", minutes: 1 },
  { id: "drink",      emoji: "💧", title: "ดื่มน้ำ 1 แก้ว",                   category: "physical", minutes: 1 },
  { id: "tell",       emoji: "💬", title: "บอกคุณพ่อแม่ว่าวันนี้เรียนอะไร",  category: "parent",   minutes: 5 },
  { id: "draw",       emoji: "🎨", title: "วาดรูปสัตว์ที่ชอบ 1 รูป",          category: "reading",  minutes: 10 },
  { id: "smile",      emoji: "😊", title: "ยิ้มกว้างๆ แล้วบอกว่ารักใคร",     category: "parent",   minutes: 2 },
  { id: "stretch",    emoji: "🤸", title: "ยืดแขนทั้งสองข้างค้างไว้ 5 วิ",   category: "physical", minutes: 2 },
];

export const BREAK_EXERCISES = [
  { emoji: "🏃", title: "กระโดด",    action: "แตะทุกครั้งที่กระโดด",  count: 10, color: "#10B981" },
  { emoji: "👏", title: "ตบมือ",     action: "แตะทุกครั้งที่ตบมือ",   count: 10, color: "#3B82F6" },
  { emoji: "🤸", title: "ยืดแขน",   action: "แตะทุกครั้งที่ยืด",     count: 8,  color: "#8B5CF6" },
  { emoji: "🦵", title: "เขย่งเท้า", action: "แตะทุกครั้งที่เขย่ง",  count: 8,  color: "#F97316" },
];

const KEY         = "kidocoachai-daily";
const HISTORY_KEY = "kidocoachai-daily-history";

export interface DayHistory {
  screen: number;
  physical: number;
  reading: number;
  parent: number;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function empty(): DailyData {
  return { date: todayStr(), screenMinutes: 0, physicalMinutes: 0, readingMinutes: 0, parentMinutes: 0, completedMissions: [] };
}

export function loadDailyHistory(): Record<string, DayHistory> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "{}"); }
  catch { return {}; }
}

function archiveDay(d: DailyData) {
  if (!d.date || typeof window === "undefined") return;
  const hist = loadDailyHistory();
  hist[d.date] = { screen: d.screenMinutes, physical: d.physicalMinutes, reading: d.readingMinutes, parent: d.parentMinutes };
  const trimmed = Object.fromEntries(Object.entries(hist).sort().slice(-35));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function loadDailyData(): DailyData {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const d = JSON.parse(raw);
    if (d.date !== todayStr()) {
      if (d.date) {
        archiveDay({ date: d.date, screenMinutes: d.screenMinutes ?? d.minutes ?? 0, physicalMinutes: d.physicalMinutes ?? 0, readingMinutes: d.readingMinutes ?? 0, parentMinutes: d.parentMinutes ?? 0, completedMissions: d.completedMissions ?? [] });
      }
      return empty();
    }
    return {
      date: d.date,
      screenMinutes:   d.screenMinutes   ?? d.minutes ?? 0,
      physicalMinutes: d.physicalMinutes ?? 0,
      readingMinutes:  d.readingMinutes  ?? 0,
      parentMinutes:   d.parentMinutes   ?? 0,
      completedMissions: d.completedMissions ?? [],
    };
  } catch { return empty(); }
}

export function saveDailyData(data: DailyData) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(data));
}

export function addScreenMinute(): DailyData {
  const d = loadDailyData();
  const next = { ...d, screenMinutes: d.screenMinutes + 1 };
  saveDailyData(next);
  return next;
}

export function completeMission(mission: Mission): DailyData {
  const d = loadDailyData();
  if (d.completedMissions.includes(mission.id)) return d;
  const next: DailyData = {
    ...d,
    completedMissions: [...d.completedMissions, mission.id],
    physicalMinutes: d.physicalMinutes + (mission.category === "physical" ? mission.minutes : 0),
    parentMinutes:   d.parentMinutes   + (mission.category === "parent"   ? mission.minutes : 0),
    readingMinutes:  d.readingMinutes  + (mission.category === "reading"  ? mission.minutes : 0),
  };
  saveDailyData(next);
  return next;
}

export function computeBalanceScore(data: DailyData): number {
  const screenScore   = Math.max(0, 25 - Math.max(0, data.screenMinutes - 60) * 0.4);
  const physicalScore = Math.min(25, (data.physicalMinutes / 15) * 25);
  const readingScore  = Math.min(25, (data.readingMinutes  / 10) * 25);
  const parentScore   = Math.min(25, (data.parentMinutes   / 10) * 25);
  return Math.round(screenScore + physicalScore + readingScore + parentScore);
}

export function randomMission(exclude: string[] = []): Mission {
  const pool = OFFLINE_MISSIONS.filter((m) => !exclude.includes(m.id));
  return pool[Math.floor(Math.random() * pool.length)] ?? OFFLINE_MISSIONS[0];
}
