"use client";

import { useEffect, useState } from "react";

const FRAMES = [
  { emoji: "⭐", msg: "เก่งมาก!" },
  { emoji: "🌟", msg: "ถูกต้อง!" },
  { emoji: "✨", msg: "เยี่ยมเลย!" },
  { emoji: "🎉", msg: "สุดยอด!" },
  { emoji: "💫", msg: "เก่งจัง!" },
];

export function CorrectEffect({ effectKey }: { effectKey: number }) {
  const [visible, setVisible] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    if (effectKey === 0) return;
    setFrameIdx((k) => (k + 1) % FRAMES.length);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(t);
  }, [effectKey]);

  if (!visible) return null;

  const frame = FRAMES[frameIdx];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      <div
        className="flex flex-col items-center gap-3"
        style={{ animation: "correct-burst 0.9s ease-out forwards" }}
      >
        <span className="text-8xl drop-shadow-xl">{frame.emoji}</span>
        <span
          className="text-2xl font-black text-white px-6 py-2 rounded-full shadow-2xl"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" }}
        >
          {frame.msg}
        </span>
      </div>
    </div>
  );
}
