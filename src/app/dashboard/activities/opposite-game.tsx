"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const PAIRS = [
  { word: "ร้อน",   answer: "เย็น",   emoji: "🔥" },
  { word: "ใหญ่",   answer: "เล็ก",   emoji: "🐘" },
  { word: "ยาว",    answer: "สั้น",   emoji: "📏" },
  { word: "เร็ว",   answer: "ช้า",    emoji: "🐇" },
  { word: "หนัก",   answer: "เบา",    emoji: "🏋️" },
  { word: "สว่าง",  answer: "มืด",    emoji: "💡" },
  { word: "สูง",    answer: "ต่ำ",    emoji: "🏔️" },
  { word: "แข็ง",   answer: "อ่อน",   emoji: "💎" },
  { word: "เปิด",   answer: "ปิด",    emoji: "🚪" },
  { word: "เต็ม",   answer: "ว่าง",   emoji: "🥛" },
  { word: "ใหม่",   answer: "เก่า",   emoji: "✨" },
  { word: "สะอาด",  answer: "สกปรก",  emoji: "🧹" },
  { word: "ดัง",    answer: "เงียบ",  emoji: "📢" },
  { word: "แห้ง",   answer: "เปียก",  emoji: "☀️" },
  { word: "ขึ้น",   answer: "ลง",     emoji: "⬆️" },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

type Q = { word: string; answer: string; emoji: string; options: string[] };

function buildQuestions(count = 10): Q[] {
  return shuffle(PAIRS).slice(0, count).map((p) => ({
    ...p,
    options: shuffle([p.answer, ...shuffle(PAIRS.filter((x) => x.answer !== p.answer)).slice(0, 3).map((x) => x.answer)]),
  }));
}

export function OppositeGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Q[]>(() => buildQuestions());
  const [index, setIndex]   = useState(0);
  const [score, setScore]   = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone]     = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    const q = questions[index];
    const prefix = index === 0 ? "มาเริ่มกันเลย! " : "";
    speak(`${prefix}อะไรคือตรงข้ามกับ ${q.word}?`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เยี่ยมมากเลย! น้องรู้จักคำตรงข้ามได้เก่งมาก! 🎉", "celebrating");
    }
  }, [done]); // eslint-disable-line

  const handlePick = useCallback((word: string) => {
    if (selected !== null) return;
    setSelected(word);
    const correct = questions[index].answer;
    const advance = () => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex((i) => i + 1); setSelected(null); }
    };
    if (word === correct) {
      setScore((s) => s + 1);
      speak(`ถูกต้องเลย! ตรงข้ามของ${questions[index].word}คือ${correct} เก่งมาก!`, "celebrating", advance);
    } else {
      speak(`ยังไม่ใช่นะ ตรงข้ามของ${questions[index].word}คือ${correct}นะ!`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-indigo-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">{score >= 8 ? "รู้คำตรงข้ามได้เก่งมาก! 🌟" : score >= 5 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => { onComplete({ score, total: questions.length }); onBack(); }} className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 rounded-xl gap-2">
            <CheckCircle2 className="w-4 h-4" /> บันทึก
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /> กลับ</button>
        <span className="text-sm text-gray-500">ข้อ {index + 1}/{questions.length}</span>
      </div>
      <Progress value={(index / questions.length) * 100} className="mb-8 h-2" />

      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-3">คำตรงข้ามของอะไร?</p>
        <div className="text-6xl mb-3">{q.emoji}</div>
        <h2 className="text-5xl font-black text-gray-900">{q.word}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt) => {
          let cls = "py-5 rounded-2xl text-xl font-bold border-2 transition-all ";
          if (selected !== null) {
            if (opt === q.answer) cls += "bg-green-100 border-green-400 text-green-800";
            else if (opt === selected) cls += "bg-red-100 border-red-400 text-red-800 opacity-70";
            else cls += "bg-white border-gray-200 text-gray-400 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-800 cursor-pointer";
          }
          return <button key={opt} onClick={() => handlePick(opt)} className={cls}>{opt}</button>;
        })}
      </div>
    </div>
  );
}
