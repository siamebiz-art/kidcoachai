"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import { useAutoNext } from "@/hooks/use-auto-next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import type { GameResult } from "@/lib/types";

const DOT_THEMES = [
  { emoji: "🍎", label: "แอปเปิ้ล", classifier: "ลูก"  },
  { emoji: "⭐", label: "ดาว",       classifier: "ดวง"  },
  { emoji: "🌸", label: "ดอกไม้",   classifier: "ดอก"  },
  { emoji: "🐶", label: "หมา",       classifier: "ตัว"  },
  { emoji: "🚗", label: "รถยนต์",   classifier: "คัน"  },
  { emoji: "🎈", label: "ลูกโป่ง",  classifier: "ลูก"  },
  { emoji: "🦋", label: "ผีเสื้อ",  classifier: "ตัว"  },
  { emoji: "📖", label: "หนังสือ",  classifier: "เล่ม" },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Round = { count: number; options: number[]; emoji: string; label: string; classifier: string };

function buildRounds(max: number, total = 10): Round[] {
  return Array.from({ length: total }, (_, i) => {
    const theme = DOT_THEMES[i % DOT_THEMES.length];
    const count = Math.floor(Math.random() * max) + 1;
    const wrongs = new Set<number>();
    while (wrongs.size < 3) {
      const w = Math.floor(Math.random() * max) + 1;
      if (w !== count) wrongs.add(w);
    }
    return { count, options: shuffle([count, ...Array.from(wrongs)]), ...theme };
  });
}

type Difficulty = "easy" | "hard";

type NextGame = { emoji: string; label: string; color: string };
export function CountingGame({ onBack, onComplete, nextGame }: { onBack: () => void; onComplete: (result?: GameResult) => void; nextGame?: NextGame }) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);
  const { countdown, cancel } = useAutoNext(
    done && !!nextGame,
    () => onComplete({ score, total: rounds.length }),
  );

  useEffect(() => { speak("มาฝึกนับจำนวนกันเลย! เลือกระดับที่ชอบนะ 🔢"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Kido asks each counting question
  useEffect(() => {
    if (!difficulty || done || rounds.length === 0) return;
    const { label, classifier } = rounds[index] ?? {};
    const prefix = index === 0 ? "เริ่มเลย! " : "";
    speak(`${prefix}มี${label}กี่${classifier}? ลองนับดูนะ!`, "talking");
  }, [index, done, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("น้องนับเลขเก่งมากเลย! ยอดเยี่ยมสุดๆ! 🏆", "celebrating");
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function startGame(diff: Difficulty) {
    setDifficulty(diff);
    setRounds(buildRounds(diff === "easy" ? 5 : 10));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }

  const handlePick = useCallback(
    (n: number) => {
      if (selected !== null) return;
      setSelected(n);
      const correct = rounds[index].count;
      const advance = () => {
        if (index + 1 >= rounds.length) setDone(true);
        else { setIndex((i) => i + 1); setSelected(null); }
      };
      const { classifier } = rounds[index];
      if (n === correct) {
        setScore((s) => s + 1);
        speak(`ถูกต้องเลย! มี ${correct} ${classifier} เก่งมากเลย!`, "celebrating", advance);
      } else {
        speak(`ยังไม่ใช่นะ มี ${correct} ${classifier}นะ ลองดูอีกครั้งนะ!`, "thinking", advance);
      }
    },
    [selected, index, rounds, speak]
  );

  if (!difficulty) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <KidoGameOverlay emotion={emotion} message={message} />
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">เกมนับจำนวน</h1>
        <p className="text-gray-500 text-sm mb-6">นับของแล้วเลือกตัวเลขที่ถูกต้อง</p>
        <div className="grid gap-3">
          {(["easy", "hard"] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => startGame(diff)}
              className={`p-5 bg-white border-2 border-gray-100 rounded-2xl text-left transition-all flex items-center gap-4 ${
                diff === "easy"
                  ? "hover:border-green-300 hover:bg-green-50"
                  : "hover:border-purple-300 hover:bg-purple-50"
              }`}
            >
              <span className="text-3xl">{diff === "easy" ? "🐣" : "🦁"}</span>
              <div>
                <div className="font-semibold text-gray-900">
                  {diff === "easy" ? "ง่าย — นับ 1-5" : "ยาก — นับ 1-10"}
                </div>
                <div className="text-sm text-gray-400 mt-0.5">
                  {diff === "easy" ? "เหมาะสำหรับเด็กเล็ก" : "ฝึกนับจำนวนมากขึ้น"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เก่งมาก! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{rounds.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 8 ? "นับเลขเก่งมาก! 🌟" : score >= 5 ? "ดีมาก ฝึกต่อไปนะ" : "ลองอีกครั้งนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { cancel(); startGame(difficulty); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button
            onClick={() => onComplete({ score, total: rounds.length })}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> บันทึกเสร็จแล้ว
          </Button>
        </div>
        {nextGame && (
          <div className={`w-full mt-5 rounded-3xl bg-gradient-to-br ${nextGame.color} shadow-lg overflow-hidden`}>
            <button
              onClick={() => onComplete({ score, total: rounds.length })}
              className="w-full p-5 flex items-center gap-4 active:scale-95 transition-transform text-left"
            >
              <span className="text-5xl">{nextGame.emoji}</span>
              <div className="flex-1">
                <p className="text-white/70 text-xs mb-0.5">เกมถัดไป 🎯</p>
                <p className="text-white font-bold text-xl">{nextGame.label}</p>
                <p className="text-white/60 text-xs mt-0.5">กำลังเริ่มอัตโนมัติ...</p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-white/25 flex items-center justify-center shrink-0 ${countdown > 0 ? "animate-pulse" : ""}`}>
                <span className="text-white font-black text-xl">{countdown > 0 ? countdown : "▶"}</span>
              </div>
            </button>
            <div className="h-1.5 bg-white/20">
              <div className="h-full bg-white/70 transition-all duration-1000 ease-linear" style={{ width: `${(countdown / 4) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  const round = rounds[index];
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <span className="text-sm text-gray-500">ข้อ {index + 1} / {rounds.length}</span>
      </div>
      <Progress value={(index / rounds.length) * 100} className="mb-6 h-2" />

      <p className="text-center text-gray-400 text-sm mb-4">มี{round.label}กี่{round.classifier}?</p>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 mb-8 min-h-32 flex flex-wrap gap-2 justify-center items-center">
        {Array.from({ length: round.count }).map((_, i) => (
          <span key={i} className="text-4xl">{round.emoji}</span>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {round.options.map((n) => {
          const isSelected = selected === n;
          const isCorrect = n === round.count;
          let cls = "rounded-2xl py-5 text-2xl font-bold border-2 transition-all ";
          if (selected !== null) {
            if (isCorrect) cls += "bg-green-100 border-green-400 text-green-700";
            else if (isSelected) cls += "bg-red-100 border-red-400 text-red-700";
            else cls += "bg-white border-gray-200 text-gray-400 opacity-50";
          } else {
            cls += "bg-white border-gray-200 text-gray-900 hover:border-purple-400 hover:bg-purple-50 cursor-pointer";
          }
          return (
            <button key={n} onClick={() => handlePick(n)} className={cls}>
              {n}
            </button>
          );
        })}
      </div>

      {score > 0 && (
        <p className="text-center text-sm text-green-600 mt-4">ถูก: {score} ✓</p>
      )}
    </div>
  );
}
