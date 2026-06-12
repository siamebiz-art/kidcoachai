"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

type Item = { word: string; emoji: string; category: string };
type Round = { item: Item; options: string[]; correct: string };

const ITEMS: Item[] = [
  { word: "แมว",        emoji: "🐱", category: "สัตว์" },
  { word: "หมา",        emoji: "🐶", category: "สัตว์" },
  { word: "ช้าง",       emoji: "🐘", category: "สัตว์" },
  { word: "กบ",         emoji: "🐸", category: "สัตว์" },
  { word: "แอปเปิ้ล",  emoji: "🍎", category: "ผลไม้" },
  { word: "กล้วย",      emoji: "🍌", category: "ผลไม้" },
  { word: "มะม่วง",     emoji: "🥭", category: "ผลไม้" },
  { word: "องุ่น",      emoji: "🍇", category: "ผลไม้" },
  { word: "ข้าว",       emoji: "🍚", category: "อาหาร" },
  { word: "ก๋วยเตี๋ยว", emoji: "🍜", category: "อาหาร" },
  { word: "ข้าวผัด",    emoji: "🍳", category: "อาหาร" },
  { word: "ซุป",        emoji: "🍲", category: "อาหาร" },
  { word: "รถยนต์",     emoji: "🚗", category: "ยานพาหนะ" },
  { word: "รถไฟ",       emoji: "🚂", category: "ยานพาหนะ" },
  { word: "เรือ",       emoji: "⛵", category: "ยานพาหนะ" },
  { word: "เครื่องบิน", emoji: "✈️", category: "ยานพาหนะ" },
  { word: "ดินสอ",      emoji: "✏️", category: "อุปกรณ์" },
  { word: "กรรไกร",     emoji: "✂️", category: "อุปกรณ์" },
  { word: "ไม้บรรทัด",  emoji: "📏", category: "อุปกรณ์" },
  { word: "ยางลบ",      emoji: "🧹", category: "อุปกรณ์" },
];

const ALL_CATEGORIES = ["สัตว์", "ผลไม้", "อาหาร", "ยานพาหนะ", "อุปกรณ์"];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

function buildRounds(count = 15): Round[] {
  return shuffle(ITEMS).slice(0, count).map((item) => {
    const others = shuffle(ALL_CATEGORIES.filter((c) => c !== item.category)).slice(0, 3);
    return {
      item,
      options: shuffle([item.category, ...others]),
      correct: item.category,
    };
  });
}

export function WordCategoryGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Round[]>(() => buildRounds());
  const [index, setIndex]     = useState(0);
  const [score, setScore]     = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone]       = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    speak(`${index === 0 ? "มาเริ่มกันเลย! " : ""}${questions[index].item.word} อยู่ในหมวดไหนนะ?`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องจำหมวดหมู่ได้ดีมาก 🎉", "celebrating");
    }
  }, [done]); // eslint-disable-line

  const handlePick = useCallback((opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    const q = questions[index];
    const advance = () => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex((i) => i + 1); setSelected(null); }
    };
    if (opt === q.correct) {
      setScore((s) => s + 1);
      speak(`ถูกต้อง! ${q.item.word} อยู่ในหมวด${q.correct} เก่งมาก!`, "celebrating", advance);
    } else {
      speak(`ยังไม่ใช่นะ ${q.item.word} อยู่ในหมวด${q.correct}`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-lime-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-lime-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 12 ? "จำหมวดหมู่ได้แม่นมากเลย! 🌟" : score >= 9 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => onComplete({ score, total: questions.length })} className="flex-1 bg-gradient-to-r from-lime-500 to-green-500 text-white border-0 rounded-xl gap-2">
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
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <span className="text-sm text-gray-500">ข้อ {index + 1}/{questions.length}</span>
      </div>
      <Progress value={(index / questions.length) * 100} className="mb-8 h-2" />

      <div className="text-center mb-8">
        <div className="text-7xl mb-3">{q.item.emoji}</div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{q.item.word}</p>
        <p className="text-sm text-gray-400">อยู่ในหมวดไหน?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt) => {
          let cls = "py-5 rounded-2xl text-base font-bold border-2 transition-all ";
          if (selected !== null) {
            if (opt === q.correct) cls += "bg-green-100 border-green-400 text-green-800";
            else if (opt === selected) cls += "bg-red-100 border-red-400 text-red-800 opacity-70";
            else cls += "bg-white border-gray-200 text-gray-400 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-lime-400 hover:bg-lime-50 text-gray-800 cursor-pointer";
          }
          return <button key={opt} onClick={() => handlePick(opt)} className={cls}>{opt}</button>;
        })}
      </div>
    </div>
  );
}
