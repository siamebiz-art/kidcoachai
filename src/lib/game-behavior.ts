/**
 * ระบบ behavioral filtering — ซ่อนเกมที่เด็กไม่สนใจ / เกินวัย
 * ข้อมูลเก็บใน localStorage ไม่ต้อง server
 */
const KEY = "kidocoachai-behavior";

export interface GameBehaviorEntry {
  /** กดย้อนจาก setup โดยไม่กด "เริ่ม" */
  setupExits: number;
  /** กดย้อนระหว่างเกมก่อนจบรอบแรก (< 20 วินาที) */
  quickExits: number;
  /** จำนวนครั้งที่เล่นจนจบ ≥ 1 รอบ */
  completedPlays: number;
  lastUpdated: string;
}

export type BehaviorMap = Record<string, GameBehaviorEntry>;

export function loadBehavior(): BehaviorMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); }
  catch { return {}; }
}

function saveBehavior(b: BehaviorMap) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(b));
}

function today() { return new Date().toISOString().slice(0, 10); }

function getEntry(gameId: string, prev: BehaviorMap): GameBehaviorEntry {
  return prev[gameId] ?? { setupExits: 0, quickExits: 0, completedPlays: 0, lastUpdated: today() };
}

/** เด็กออกจาก setup โดยไม่กดเริ่ม */
export function recordSetupExit(gameId: string) {
  const prev = loadBehavior();
  const e = getEntry(gameId, prev);
  saveBehavior({ ...prev, [gameId]: { ...e, setupExits: e.setupExits + 1, lastUpdated: today() } });
}

/** เด็กออกจากเกมก่อนจบรอบแรก */
export function recordQuickExit(gameId: string) {
  const prev = loadBehavior();
  const e = getEntry(gameId, prev);
  saveBehavior({ ...prev, [gameId]: { ...e, quickExits: e.quickExits + 1, lastUpdated: today() } });
}

/** เด็กเล่นจนจบ ≥ 1 รอบ — รีเซ็ต exit counters ให้โอกาสใหม่ */
export function recordCompletedPlay(gameId: string) {
  const prev = loadBehavior();
  const e = getEntry(gameId, prev);
  saveBehavior({ ...prev, [gameId]: { ...e, completedPlays: e.completedPlays + 1, lastUpdated: today() } });
}

/**
 * ตรวจสอบว่าควรซ่อนเกมนี้หรือไม่
 * requiresReading=true: ซ่อนหลังจาก setupExit ≥ 1 หรือ quickExit ≥ 1
 * เกมปกติ: ซ่อนหลังจาก (setupExits + quickExits) ≥ 3
 */
export function shouldHideGame(gameId: string, requiresReading: boolean, behavior: BehaviorMap): boolean {
  const e = behavior[gameId];
  if (!e) return false;
  // ถ้าเคยเล่นจนจบ ≥ 2 ครั้ง → อย่าซ่อน (เด็กชอบเกมนี้)
  if (e.completedPlays >= 2) return false;
  if (requiresReading) {
    // เกมอ่าน: เข้ามาแล้วออกทันที 1 ครั้ง = ไม่พร้อม → ซ่อน
    return (e.setupExits + e.quickExits) >= 1;
  }
  // เกมปกติ: ออกเร็วสะสม ≥ 3 ครั้ง → ซ่อนชั่วคราว
  return (e.setupExits + e.quickExits) >= 3;
}
