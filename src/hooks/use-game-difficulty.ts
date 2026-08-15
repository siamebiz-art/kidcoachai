"use client";

/**
 * Hook สำหรับจัดการ difficulty ของแต่ละเกม
 * เก็บใน localStorage (เร็ว, ไม่เสีย API) และ auto-promote ถ้าเด็กเก่งพอ
 *
 * Logic:
 *  - เริ่มที่ 'easy' เสมอ
 *  - ถ้า avg accuracy ≥ 80% ใน 3 sessions → เลื่อนขึ้น medium/hard อัตโนมัติ
 *  - ไม่ลด difficulty ลงเองเด็ดขาด (ให้เด็กเลือก setup เองถ้าอยากลอง)
 */

import { useState, useEffect } from "react";

export type GameDifficulty = "easy" | "medium" | "hard";

const diffKey = (id: string) => `kido_diff_${id}`;
const perfKey = (id: string, d: GameDifficulty) => `kido_perf_${id}_${d}`;

function readStoredDiff(gameId: string): GameDifficulty {
  if (typeof window === "undefined") return "easy";
  return (localStorage.getItem(diffKey(gameId)) ?? "easy") as GameDifficulty;
}

export function useGameDifficulty(gameId: string) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [justPromoted, setJustPromoted] = useState(false);
  const [promotedTo, setPromotedTo]   = useState<GameDifficulty | null>(null);

  useEffect(() => {
    setDifficulty(readStoredDiff(gameId));
  }, [gameId]);

  /**
   * เรียกหลังเกมจบ — บันทึก accuracy และ return { nextDifficulty, promoted }
   * accuracy = 0-100
   */
  function recordResult(accuracy: number): {
    nextDifficulty: GameDifficulty;
    promoted: boolean;
  } {
    // บันทึกประวัติ accuracy สำหรับ difficulty นี้
    const key = perfKey(gameId, difficulty);
    const history: number[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    history.push(Math.round(accuracy));
    const recent = history.slice(-5); // เก็บแค่ 5 ครั้งล่าสุด
    localStorage.setItem(key, JSON.stringify(recent));

    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const shouldPromote =
      recent.length >= 3 && avg >= 80 && difficulty !== "hard";

    if (shouldPromote) {
      const next: GameDifficulty = difficulty === "easy" ? "medium" : "hard";
      localStorage.setItem(diffKey(gameId), next);
      setDifficulty(next);
      setJustPromoted(true);
      setPromotedTo(next);
      return { nextDifficulty: next, promoted: true };
    }

    return { nextDifficulty: difficulty, promoted: false };
  }

  function clearJustPromoted() {
    setJustPromoted(false);
    setPromotedTo(null);
  }

  // แผนที่ difficulty → ชื่อภาษาไทย
  const DIFF_LABEL: Record<GameDifficulty, string> = {
    easy:   "ง่าย",
    medium: "กลาง",
    hard:   "ยาก",
  };

  return {
    difficulty,
    diffLabel: DIFF_LABEL[difficulty],
    recordResult,
    justPromoted,
    promotedTo,
    promotedToLabel: promotedTo ? DIFF_LABEL[promotedTo] : null,
    clearJustPromoted,
  };
}
