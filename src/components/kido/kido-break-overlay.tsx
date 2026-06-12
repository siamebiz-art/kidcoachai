"use client";

import { useState } from "react";
import Link from "next/link";
import { BREAK_EXERCISES } from "@/lib/daily-data";

const ANIM_CSS = `
@keyframes kidoBounce { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.08)} }
@keyframes kidoWiggle { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
@keyframes tapPulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
`;

export function KidoBreakOverlay({
  type,
  dailyMinutes,
  limitMinutes,
  onResume,
}: {
  type: "activity" | "limit";
  dailyMinutes: number;
  limitMinutes: number;
  onResume?: () => void;
}) {
  const [exercise] = useState(
    () => BREAK_EXERCISES[Math.floor(Math.random() * BREAK_EXERCISES.length)],
  );
  const [taps, setTaps] = useState(0);
  const isDone = taps >= exercise.count;

  if (type === "limit") {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)" }}
      >
        <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kido-sleep.png" alt="Kido"
          className="w-36 h-36 object-contain mb-2"
          style={{ animation: "kidoBounce 0.8s ease-in-out infinite", filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.6))" }}
        />
        <div className="text-5xl mb-3">🌟</div>
        <h2 className="text-white text-2xl font-bold text-center mb-2">เก่งมากเลย!</h2>
        <p className="text-white/80 text-center mb-1">
          วันนี้เล่นครบ <span className="font-bold text-amber-300">{limitMinutes} นาที</span> แล้ว
        </p>
        <p className="text-white/60 text-center text-sm mb-8">
          ไปเล่นของเล่นจริงๆ หรืออ่านนิทานกับคุณพ่อคุณแม่นะ 😊
        </p>
        <Link href="/dashboard">
          <button className="bg-white text-purple-700 font-bold px-10 py-4 rounded-2xl text-base shadow-2xl active:scale-95 transition-transform">
            ตกลง กลับหน้าหลัก
          </button>
        </Link>
      </div>
    );
  }

  /* ── Activity Break (Level 2): interactive exercise ── */
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%)" }}
    >
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isDone ? "/kido-celebrate.png" : "/kido-point.png"} alt="Kido"
        className="w-28 h-28 object-contain mb-1"
        style={{
          animation: isDone ? "kidoBounce 0.4s ease-in-out infinite" : "kidoWiggle 1.5s ease-in-out infinite",
          filter: "drop-shadow(0 8px 24px rgba(5,150,105,0.6))",
        }}
      />

      <h2 className="text-white text-xl font-bold text-center mb-0.5">พักตาก่อนนะ!</h2>
      <p className="text-white/50 text-xs mb-4">เล่นมา 30 นาทีแล้ว · วันนี้เล่นไป {dailyMinutes} นาที</p>

      {/* Exercise card */}
      <div className="bg-white/15 border border-white/25 rounded-3xl p-5 max-w-xs w-full text-center mb-5">
        <div className="text-5xl mb-2">{exercise.emoji}</div>
        <h3 className="text-white text-lg font-bold mb-0.5">{exercise.title}</h3>
        <p className="text-white/60 text-sm mb-4">{exercise.action}</p>

        {/* Counter */}
        <div className="mb-4">
          <div
            className="text-7xl font-black leading-none mb-1 transition-colors"
            style={{ color: isDone ? "#FCD34D" : "white" }}
          >
            {taps}
          </div>
          <div className="text-white/50 text-sm">จาก {exercise.count} ครั้ง</div>
          <div className="w-full h-3 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(taps / exercise.count) * 100}%`, backgroundColor: isDone ? "#FCD34D" : exercise.color }}
            />
          </div>
        </div>

        {/* Tap button */}
        {!isDone ? (
          <button
            onClick={() => setTaps((t) => Math.min(t + 1, exercise.count))}
            className="w-28 h-28 rounded-full text-white font-black text-xl shadow-2xl active:scale-90 transition-transform select-none mx-auto block"
            style={{ backgroundColor: exercise.color, animation: "tapPulse 1s ease-in-out infinite" }}
          >
            แตะ!<br />👆
          </button>
        ) : (
          <div className="text-4xl animate-bounce">🎉</div>
        )}
      </div>

      {isDone && (
        <button
          onClick={onResume}
          className="bg-white text-green-700 font-bold px-10 py-4 rounded-2xl text-base shadow-2xl active:scale-95 transition-transform"
        >
          เก่งมาก! เล่นต่อได้เลย 🎮
        </button>
      )}
    </div>
  );
}
