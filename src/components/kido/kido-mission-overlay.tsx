"use client";

import { useState } from "react";
import type { Mission } from "@/lib/daily-data";
import { completeMission } from "@/lib/daily-data";

const ANIM_CSS = `
@keyframes missionFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes missionPop   { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
`;

const CATEGORY_COLOR: Record<Mission["category"], string> = {
  physical: "#10B981",
  parent:   "#F59E0B",
  reading:  "#8B5CF6",
};

const CATEGORY_LABEL: Record<Mission["category"], string> = {
  physical: "ออกกำลังกาย",
  parent:   "เวลากับครอบครัว",
  reading:  "กิจกรรมเรียนรู้",
};

export function KidoMissionOverlay({
  mission,
  onComplete,
  onSkip,
}: {
  mission: Mission;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [done, setDone] = useState(false);

  function handleComplete() {
    completeMission(mission);
    setDone(true);
    setTimeout(onComplete, 2000);
  }

  const color = CATEGORY_COLOR[mission.category];

  return (
    <div
      className="fixed inset-0 z-[190] flex flex-col items-center justify-center p-6"
      style={{ background: "rgba(10,10,25,0.85)", backdropFilter: "blur(12px)" }}
    >
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl"
        style={{ animation: "missionPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
      >
        {done ? (
          <div className="py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kido-celebrate.png" alt="Kido" className="w-24 h-24 object-contain mx-auto mb-1 animate-bounce" />
            <h2 className="text-xl font-black text-gray-900 mb-1">เก่งมากเลย!</h2>
            <p className="text-gray-500 text-sm">+{mission.minutes} นาที บันทึกแล้ว ✓</p>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kido-point.png" alt="Kido"
              className="w-20 h-20 object-contain mx-auto mb-2"
              style={{ animation: "missionFloat 2.5s ease-in-out infinite" }}
            />

            <div
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3 text-white"
              style={{ backgroundColor: color }}
            >
              🎯 ภารกิจจาก Kido
            </div>

            <div className="text-5xl mb-2">{mission.emoji}</div>
            <h2 className="text-xl font-black text-gray-900 mb-0.5">{mission.title}</h2>
            <p className="text-gray-400 text-xs mb-1">{CATEGORY_LABEL[mission.category]}</p>
            <p className="text-gray-400 text-xs mb-4">ทำแล้วกลับมาบอก Kido ด้วยนะ! 😊</p>

            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-amber-700 text-sm font-bold mb-5">
              ⭐ รับ {mission.minutes} นาที ออกจากหน้าจอ
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleComplete}
                className="w-full py-3.5 rounded-2xl text-white font-black text-base shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: color }}
              >
                ทำแล้ว! ✓
              </button>
              <button
                onClick={onSkip}
                className="w-full py-2.5 rounded-2xl text-gray-400 font-semibold text-sm hover:text-gray-600 transition-colors"
              >
                ข้ามไปก่อน
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
