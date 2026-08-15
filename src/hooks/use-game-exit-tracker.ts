/**
 * Hook ติดตาม "early exit" โดยอัตโนมัติ
 * ใช้ในทุกหน้าเกมที่มี phase: "setup" | "game" | "done"
 *
 * วิธีใช้:
 *   const { markRoundStarted } = useGameExitTracker("count-it", phase);
 *   // เรียก markRoundStarted() เมื่อเด็กกด "เริ่มเลย" แล้วเข้าสู่รอบแรก
 */
"use client";

import { useEffect, useRef } from "react";
import { recordSetupExit, recordQuickExit, recordCompletedPlay } from "@/lib/game-behavior";

const QUICK_EXIT_MS = 20_000; // ออกภายใน 20 วิ = ไม่สนใจ

export function useGameExitTracker(gameId: string, phase: string) {
  const phaseRef   = useRef(phase);
  const startTime  = useRef(Date.now());
  const roundStart = useRef<number | null>(null); // เวลาที่กดเริ่มเล่น

  // อัพเดต ref ทุกครั้งที่ phase เปลี่ยน
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // บันทึกเวลาเริ่ม
  useEffect(() => { startTime.current = Date.now(); }, []);

  // Cleanup: วิเคราะห์พฤติกรรมเมื่อ unmount
  useEffect(() => {
    return () => {
      const p = phaseRef.current;
      if (p === "done") {
        // จบปกติ — บันทึก completed
        recordCompletedPlay(gameId);
        return;
      }
      if (p === "setup") {
        // ออกจาก setup โดยไม่กดเริ่ม
        recordSetupExit(gameId);
        return;
      }
      if (p === "game") {
        // ออกระหว่างเกม — ตรวจสอบว่าเร็วแค่ไหน
        const ref  = roundStart.current ?? startTime.current;
        const elapsed = Date.now() - ref;
        if (elapsed < QUICK_EXIT_MS) {
          recordQuickExit(gameId);
        }
      }
    };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    /** เรียกเมื่อเด็กกดปุ่ม "เริ่ม" และ phase เปลี่ยนเป็น "game" */
    markRoundStarted: () => { roundStart.current = Date.now(); },
  };
}
