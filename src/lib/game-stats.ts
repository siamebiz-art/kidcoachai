/**
 * วิเคราะห์ performance ของเด็กแต่ละเกม
 * ใช้ gameSessions จาก Clerk metadata (sync ข้าม device ได้)
 */
import type { GameSession } from "./types";

/** สถานะของเกมสำหรับเด็กคนนี้ */
export type GameStatus =
  | "ready"        // เล่นได้ตามวัย
  | "mastered"     // เก่งแล้ว (avg ≥ 80% ใน 3 sessions ล่าสุด)
  | "too-hard"     // ยากเกินไป (avg < 35% ใน 3 sessions ล่าสุด) → ซ่อนชั่วคราว
  | "unlock-soon"  // อีกไม่นาน (อยู่ในช่วง minAge-6 ถึง minAge)
  | "locked";      // ยังไม่ถึงวัย (< minAge - 6 เดือน) → ซ่อนทั้งหมด

export interface GameDisplayInfo {
  status: GameStatus;
  /** ค่าเฉลี่ย accuracy (0-100), -1 = ยังไม่เคยเล่น */
  avgAccuracy: number;
  /** จำนวน session ที่เคยเล่น */
  sessions: number;
  /** จำนวนเดือนที่เหลือก่อนจะ unlock (เฉพาะ unlock-soon) */
  monthsUntilReady: number;
}

const LOCK_BUFFER_MONTHS = 6; // แสดง "coming soon" ก่อน minAge 6 เดือน
const MIN_SESSIONS_TO_JUDGE = 3; // ต้องเล่นอย่างน้อย 3 ครั้งถึงจะตัดสิน
const TOO_HARD_THRESHOLD = 35;   // avg accuracy < 35% → too-hard
const MASTERED_THRESHOLD = 80;   // avg accuracy ≥ 80% → mastered

export function getGameDisplayInfo(
  gameId: string,
  childAgeMonths: number,
  minAgeMonths: number,
  gameSessions: GameSession[]
): GameDisplayInfo {
  // ดึง sessions ของเกมนี้ เรียงจากใหม่สุด
  const mySessions = [...gameSessions]
    .filter((s) => s.gameId === gameId)
    .sort((a, b) => b.ts - a.ts);

  const recent = mySessions.slice(0, 5);
  const sessionCount = mySessions.length;

  const avgAccuracy =
    recent.length > 0
      ? Math.round(recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length)
      : -1;

  const monthsUntilReady = Math.max(0, minAgeMonths - childAgeMonths);

  // ── ตัดสินสถานะ ─────────────────────────────────────────────────────────
  let status: GameStatus;

  if (childAgeMonths < minAgeMonths - LOCK_BUFFER_MONTHS) {
    status = "locked";
  } else if (childAgeMonths < minAgeMonths) {
    status = "unlock-soon";
  } else if (
    sessionCount >= MIN_SESSIONS_TO_JUDGE &&
    avgAccuracy >= 0 &&
    avgAccuracy < TOO_HARD_THRESHOLD
  ) {
    // ยกเว้น: ถ้าอายุเกิน minAge ไป 12 เดือนแล้ว ให้ลองใหม่ (เด็กโตขึ้น)
    const gaveUpButOlderNow = childAgeMonths >= minAgeMonths + 12;
    status = gaveUpButOlderNow ? "ready" : "too-hard";
  } else if (
    sessionCount >= MIN_SESSIONS_TO_JUDGE &&
    avgAccuracy >= MASTERED_THRESHOLD
  ) {
    status = "mastered";
  } else {
    status = "ready";
  }

  return { status, avgAccuracy, sessions: sessionCount, monthsUntilReady };
}
