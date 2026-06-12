"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const TARGETS = [
  { type: "number", value: "1", label: "เลข 1", bg: "#fde68a", text: "#92400e" },
  { type: "number", value: "2", label: "เลข 2", bg: "#bbf7d0", text: "#166534" },
  { type: "number", value: "3", label: "เลข 3", bg: "#bfdbfe", text: "#1e40af" },
  { type: "number", value: "4", label: "เลข 4", bg: "#fecaca", text: "#991b1b" },
  { type: "number", value: "5", label: "เลข 5", bg: "#e9d5ff", text: "#5b21b6" },
];

const ALL_VALUES = ["1", "2", "3", "4", "5"];
const GAME_TIME = 30;
const BUBBLE_COUNT = 12;

type Bubble = { id: number; value: string; x: number; y: number; popped: boolean };

function makeBubbles(targetValue: string): Bubble[] {
  return Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
    id: i,
    value: i < 4 ? targetValue : ALL_VALUES.filter((v) => v !== targetValue)[i % 4],
    x: 5 + (i % 4) * 23 + Math.random() * 8,
    y: 5 + Math.floor(i / 4) * 30 + Math.random() * 8,
    popped: false,
  }));
}

export function BubblePopGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [round, setRound]     = useState(0);
  const [target]              = useState(() => TARGETS[Math.floor(Math.random() * TARGETS.length)]);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => makeBubbles(TARGETS[0].value));
  const [score, setScore]     = useState(0);
  const [wrong, setWrong]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [started, setStarted] = useState(false);
  const [done, setDone]       = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcedDone = useRef(false);

  useEffect(() => {
    if (!started || done) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setDone(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, done]);

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak(`หมดเวลาแล้ว! น้องป๊อปได้ ${score} ฟอง เก่งมากเลย!`, "celebrating");
    }
  }, [done]); // eslint-disable-line

  function startGame() {
    setBubbles(makeBubbles(target.value));
    speak(`ป๊อปฟองที่มี${target.label}ให้เร็วที่สุด! มี ${GAME_TIME} วินาที!`, "talking");
    setStarted(true);
  }

  const refreshBubbles = useCallback(() => {
    setBubbles(makeBubbles(target.value));
    setRound((r) => r + 1);
  }, [target.value]);

  const popBubble = useCallback((id: number, value: string) => {
    if (!started || done) return;
    setBubbles((bs) => bs.map((b) => b.id === id ? { ...b, popped: true } : b));
    if (value === target.value) {
      setScore((s) => s + 1);
    } else {
      setWrong((w) => w + 1);
    }
    setTimeout(() => {
      setBubbles((bs) => {
        const remaining = bs.filter((b) => !b.popped || b.id !== id);
        if (remaining.filter((b) => !b.popped && b.value === target.value).length === 0) {
          refreshBubbles();
        }
        return remaining;
      });
    }, 300);
  }, [started, done, target.value, refreshBubbles]);

  if (!started) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"><ChevronLeft className="w-4 h-4" /> กลับ</button>
        <div className="text-8xl mb-4">🫧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เกมป๊อปบับเบิล</h2>
        <p className="text-gray-500 mb-6">ป๊อปเฉพาะฟองที่มี <strong style={{ color: target.text }}>{target.label}</strong> ให้เร็วที่สุด!</p>
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-lg" style={{ background: target.bg, color: target.text }}>
          {target.value}
        </div>
        <Button onClick={startGame} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 rounded-2xl px-8 py-3 text-lg">
          เริ่มเลย! 🫧
        </Button>
      </div>
    );
  }

  if (done) {
    const total = score + wrong;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">หมดเวลา! ⏰</h2>
        <p className="text-yellow-600 font-bold text-4xl mb-1">{score} ฟอง</p>
        <p className="text-gray-400 text-sm mb-1">ความแม่นยำ {accuracy}%</p>
        <p className="text-gray-400 text-sm mb-6">{score >= 15 ? "เร็วและแม่นมาก! 🌟" : score >= 8 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setScore(0); setWrong(0); setTimeLeft(GAME_TIME); setDone(false); setStarted(false); setRound(0); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => { onComplete({ score, total: score + wrong }); onBack(); }} className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 rounded-xl gap-2">
            <CheckCircle2 className="w-4 h-4" /> บันทึก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto select-none">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400"><ChevronLeft className="w-4 h-4" /> กลับ</button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-green-600">✅ {score}</span>
          <span className={`text-lg font-black ${timeLeft <= 10 ? "text-red-500" : "text-gray-700"}`}>⏱ {timeLeft}s</span>
        </div>
      </div>

      <div className="text-center mb-3">
        <p className="text-sm text-gray-500">ป๊อปเฉพาะฟองที่มี</p>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-black shadow-md" style={{ background: target.bg, color: target.text }}>
          {target.value}
        </div>
      </div>

      <div className="relative bg-gradient-to-b from-sky-100 to-blue-50 rounded-3xl overflow-hidden" style={{ height: "380px" }} key={round}>
        {bubbles.filter((b) => !b.popped).map((b) => (
          <button
            key={b.id}
            onClick={() => popBubble(b.id, b.value)}
            className="absolute w-16 h-16 rounded-full font-black text-2xl shadow-md transition-transform active:scale-75 hover:scale-110 border-4 border-white/60"
            style={{ left: `${b.x}%`, top: `${b.y}%`, background: b.value === target.value ? target.bg : "#e5e7eb", color: b.value === target.value ? target.text : "#6b7280" }}
          >
            {b.value}
          </button>
        ))}
      </div>
    </div>
  );
}
