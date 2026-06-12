"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const COLORS = [
  { id: "red",    bg: "bg-red-400",    flash: "bg-red-200",    border: "border-red-500"    },
  { id: "blue",   bg: "bg-blue-400",   flash: "bg-blue-200",   border: "border-blue-500"   },
  { id: "green",  bg: "bg-green-400",  flash: "bg-green-200",  border: "border-green-500"  },
  { id: "yellow", bg: "bg-yellow-400", flash: "bg-yellow-200", border: "border-yellow-500" },
];

const TOTAL_ROUNDS = 8;
type Phase = "showing" | "inputting" | "feedback";

function seqLen(r: number) { return r < 3 ? 2 : r < 6 ? 3 : 4; }
function makeSeq(r: number) {
  return Array.from({ length: seqLen(r) }, () => Math.floor(Math.random() * 4));
}

export function RhythmGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [round, setRound]     = useState(0);
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);
  const [seq, setSeq]         = useState<number[]>(() => makeSeq(0));
  const [phase, setPhase]     = useState<Phase>("showing");
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [lit, setLit]         = useState<number | null>(null);

  const { emotion, message, speak } = useKidoVoice();
  const ivRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqRef      = useRef(seq);
  const announcedRef = useRef(false);

  function playSeq(s: number[]) {
    seqRef.current = s;
    if (ivRef.current) clearInterval(ivRef.current);
    let i = 0;
    ivRef.current = setInterval(() => {
      if (i < s.length) {
        const c = s[i++];
        setLit(c);
        setTimeout(() => setLit(null), 500);
      } else {
        clearInterval(ivRef.current!);
        ivRef.current = null;
        setTimeout(() => setPhase("inputting"), 500);
      }
    }, 900);
  }

  function startRound(r: number) {
    const s = makeSeq(r);
    setSeq(s);
    setPlayerInput([]);
    setLastCorrect(null);
    setPhase("showing");
    playSeq(s);
  }

  useEffect(() => {
    speak("ดูสีที่กะพริบ แล้วกดตามลำดับเดิมนะ!", "talking");
    playSeq(seq);
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedRef.current) {
      announcedRef.current = true;
      speak("เยี่ยมมากเลย! น้องมีความจำและสมาธิดีมาก 🎉", "celebrating");
    }
  }, [done]); // eslint-disable-line

  function handleTap(colorIdx: number) {
    if (phase !== "inputting") return;
    const next = [...playerInput, colorIdx];
    const pos = next.length - 1;
    const ok = seqRef.current[pos] === colorIdx;
    setPlayerInput(next);

    if (!ok) {
      setLastCorrect(false);
      setPhase("feedback");
      speak("ไม่ใช่สีนั้นนะ ลองรอบต่อไปนะ!", "thinking", () => {
        setRound((r) => {
          const nr = r + 1;
          if (nr >= TOTAL_ROUNDS) { setDone(true); return r; }
          startRound(nr);
          return nr;
        });
      });
    } else if (next.length === seqRef.current.length) {
      setLastCorrect(true);
      setPhase("feedback");
      setScore((s) => s + 1);
      speak("เก่งมาก! จำได้ถูกต้องทุกสี!", "celebrating", () => {
        setRound((r) => {
          const nr = r + 1;
          if (nr >= TOTAL_ROUNDS) { setDone(true); return r; }
          startRound(nr);
          return nr;
        });
      });
    }
  }

  function restartGame() {
    announcedRef.current = false;
    setRound(0); setScore(0); setDone(false);
    startRound(0);
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-violet-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{TOTAL_ROUNDS}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 6 ? "ความจำและสมาธิดีมากเลย! 🌟" : score >= 4 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={restartGame} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => onComplete({ score, total: TOTAL_ROUNDS })} className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 rounded-xl gap-2">
            <CheckCircle2 className="w-4 h-4" /> บันทึก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <span className="text-sm text-gray-500">รอบ {round + 1}/{TOTAL_ROUNDS}</span>
      </div>

      <div className="text-center my-6 h-6">
        {phase === "showing"   && <p className="text-gray-400 text-sm animate-pulse">ดูสีที่กะพริบ...</p>}
        {phase === "inputting" && <p className="text-purple-600 font-semibold text-sm">กดตามลำดับ! ({playerInput.length}/{seq.length})</p>}
        {phase === "feedback"  && <p className={`font-bold text-sm ${lastCorrect ? "text-green-600" : "text-red-500"}`}>{lastCorrect ? "✅ ถูกต้อง!" : "❌ ไม่ใช่"}</p>}
      </div>

      {/* progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {seq.map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
            i >= playerInput.length
              ? "bg-gray-100 border-gray-300"
              : phase === "feedback" && !lastCorrect && i === playerInput.length - 1
              ? "bg-red-400 border-red-500"
              : "bg-green-400 border-green-500"
          }`} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {COLORS.map((color, i) => (
          <button
            key={color.id}
            onClick={() => handleTap(i)}
            disabled={phase !== "inputting"}
            className={`h-28 rounded-3xl border-4 transition-all duration-150 ${
              lit === i
                ? `${color.flash} ${color.border} scale-110 shadow-xl`
                : `${color.bg} ${color.border} ${phase === "inputting" ? "hover:scale-105 active:scale-95 cursor-pointer" : "opacity-70"}`
            }`}
          />
        ))}
      </div>
    </div>
  );
}
