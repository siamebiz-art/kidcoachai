"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const EMOTIONS = [
  { emoji: "😊", word: "มีความสุข",  scenario: "ได้รับของขวัญที่ชอบมาก" },
  { emoji: "😢", word: "เศร้า",       scenario: "ของเล่นโปรดหาย" },
  { emoji: "😠", word: "โกรธ",        scenario: "ถูกเพื่อนแย่งของเล่น" },
  { emoji: "😨", word: "กลัว",        scenario: "ได้ยินเสียงฟ้าร้องดังมาก" },
  { emoji: "😄", word: "ตื่นเต้น",   scenario: "พรุ่งนี้จะไปสวนสนุก" },
  { emoji: "😲", word: "ตกใจ",        scenario: "มีคนมาแอบทำให้ตกใจ" },
  { emoji: "🥱", word: "ง่วงนอน",    scenario: "ตื่นนอนเช้ามากแล้วยังเหนื่อย" },
  { emoji: "😌", word: "สบายใจ",     scenario: "นอนฟังเพลงที่ชอบเงียบๆ" },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

type Q = { emoji: string; word: string; scenario: string; options: string[] };

function buildQuestions(count = 8): Q[] {
  return shuffle(EMOTIONS).slice(0, count).map((e) => ({
    ...e,
    options: shuffle([e.word, ...shuffle(EMOTIONS.filter((x) => x.word !== e.word)).slice(0, 3).map((x) => x.word)]),
  }));
}

export function EmotionGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Q[]>(() => buildQuestions());
  const [index, setIndex]     = useState(0);
  const [score, setScore]     = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone]       = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    const q = questions[index];
    const prefix = index === 0 ? "มาเริ่มกันเลย! " : "";
    speak(`${prefix}น้องรู้สึกยังไง ถ้า${q.scenario}?`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องเข้าใจความรู้สึกของคนได้ดีมาก 🎉", "celebrating");
    }
  }, [done]); // eslint-disable-line

  const handlePick = useCallback((word: string) => {
    if (selected !== null) return;
    setSelected(word);
    const correct = questions[index].word;
    const advance = () => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex((i) => i + 1); setSelected(null); }
    };
    if (word === correct) {
      setScore((s) => s + 1);
      speak(`ถูกต้องเลย! ถ้า${questions[index].scenario} ก็ต้องรู้สึก${correct}สิ เก่งมาก!`, "celebrating", advance);
    } else {
      speak(`ลองคิดใหม่นะ ถ้า${questions[index].scenario} น้องจะรู้สึก${correct}`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">{score >= 6 ? "เข้าใจอารมณ์ได้ดีมาก! 🌟" : score >= 4 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => { onComplete({ score, total: questions.length }); onBack(); }} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 rounded-xl gap-2">
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
        <p className="text-gray-400 text-sm mb-3">ถ้า{q.scenario} น้องรู้สึกยังไง?</p>
        <div className="text-8xl mb-2">{q.emoji}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt) => {
          let cls = "py-4 rounded-2xl text-lg font-bold border-2 transition-all ";
          if (selected !== null) {
            if (opt === q.word) cls += "bg-green-100 border-green-400 text-green-800";
            else if (opt === selected) cls += "bg-red-100 border-red-400 text-red-800 opacity-70";
            else cls += "bg-white border-gray-200 text-gray-400 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-800 cursor-pointer";
          }
          return <button key={opt} onClick={() => handlePick(opt)} className={cls}>{opt}</button>;
        })}
      </div>
    </div>
  );
}
