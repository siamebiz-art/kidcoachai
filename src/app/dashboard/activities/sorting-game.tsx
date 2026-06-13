"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import type { GameResult } from "@/lib/types";

type Category = { label: string; emoji: string; color: string; items: { emoji: string; name: string }[] };
type SortSet = { name: string; categories: [Category, Category] };

const SORT_SETS: SortSet[] = [
  {
    name: "สัตว์ vs ผลไม้",
    categories: [
      {
        label: "สัตว์", emoji: "🐾", color: "from-orange-400 to-amber-400",
        items: [
          { emoji: "🐱", name: "แมว" }, { emoji: "🐶", name: "หมา" }, { emoji: "🐸", name: "กบ" },
          { emoji: "🐰", name: "กระต่าย" }, { emoji: "🦁", name: "สิงโต" }, { emoji: "🐮", name: "วัว" },
        ],
      },
      {
        label: "ผลไม้", emoji: "🍎", color: "from-red-400 to-pink-400",
        items: [
          { emoji: "🍎", name: "แอปเปิ้ล" }, { emoji: "🍌", name: "กล้วย" }, { emoji: "🍊", name: "ส้ม" },
          { emoji: "🍇", name: "องุ่น" }, { emoji: "🍓", name: "สตรอว์เบอร์รี่" }, { emoji: "🍉", name: "แตงโม" },
        ],
      },
    ],
  },
  {
    name: "ยานพาหนะ vs สิ่งของ",
    categories: [
      {
        label: "ยานพาหนะ", emoji: "🚗", color: "from-blue-400 to-cyan-400",
        items: [
          { emoji: "🚗", name: "รถ" }, { emoji: "✈️", name: "เครื่องบิน" }, { emoji: "🚂", name: "รถไฟ" },
          { emoji: "🚌", name: "รถบัส" }, { emoji: "🚢", name: "เรือ" }, { emoji: "🚁", name: "เฮลิคอปเตอร์" },
        ],
      },
      {
        label: "สิ่งของ", emoji: "📦", color: "from-purple-400 to-violet-400",
        items: [
          { emoji: "📚", name: "หนังสือ" }, { emoji: "✏️", name: "ดินสอ" }, { emoji: "🎒", name: "กระเป๋า" },
          { emoji: "⏰", name: "นาฬิกา" }, { emoji: "📱", name: "โทรศัพท์" }, { emoji: "💡", name: "หลอดไฟ" },
        ],
      },
    ],
  },
  {
    name: "อาหาร vs เครื่องดื่ม",
    categories: [
      {
        label: "อาหาร", emoji: "🍚", color: "from-yellow-400 to-orange-400",
        items: [
          { emoji: "🍚", name: "ข้าว" }, { emoji: "🍜", name: "ก๋วยเตี๋ยว" }, { emoji: "🍕", name: "พิซซ่า" },
          { emoji: "🍳", name: "ไข่ดาว" }, { emoji: "🥗", name: "สลัด" }, { emoji: "🍱", name: "กล่องข้าว" },
        ],
      },
      {
        label: "เครื่องดื่ม", emoji: "🥤", color: "from-cyan-400 to-blue-400",
        items: [
          { emoji: "🥤", name: "น้ำอัดลม" }, { emoji: "🧃", name: "น้ำผลไม้" }, { emoji: "🍵", name: "ชา" },
          { emoji: "☕", name: "กาแฟ" }, { emoji: "🥛", name: "นม" }, { emoji: "💧", name: "น้ำเปล่า" },
        ],
      },
    ],
  },
];

type Item = { emoji: string; name: string; catIndex: 0 | 1 };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildItems(set: SortSet): Item[] {
  const all: Item[] = set.categories.flatMap((cat, ci) =>
    cat.items.map((item) => ({ ...item, catIndex: ci as 0 | 1 }))
  );
  return shuffle(all);
}

type NextGame = { emoji: string; label: string; color: string };
export function SortingGame({ onBack, onComplete, nextGame }: { onBack: () => void; onComplete: (result?: GameResult) => void; nextGame?: NextGame }) {
  const [setIdx, setSetIdx] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => { speak("มาจัดหมวดหมู่กันเลย! เลือกชุดที่ชอบนะ 🗂️"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Kido names each item and asks which category
  useEffect(() => {
    if (setIdx === null || done || items.length === 0) return;
    const item = items[current];
    if (!item) return;
    const prefix = current === 0 ? "เริ่มเลย! " : "";
    speak(`${prefix}${item.name} เป็นอะไรนะ?`, "talking");
  }, [current, done, setIdx, items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("น้องจัดหมวดหมู่ได้เก่งมากเลย! 🏆", "celebrating");
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function startGame(si: number) {
    setSetIdx(si);
    setItems(buildItems(SORT_SETS[si]));
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }

  const handleSort = useCallback(
    (catIndex: number) => {
      if (selected !== null || setIdx === null) return;
      setSelected(catIndex);
      const item = items[current];
      const correctLabel = SORT_SETS[setIdx].categories[item.catIndex].label;
      const advance = () => {
        if (current + 1 >= items.length) setDone(true);
        else { setCurrent((c) => c + 1); setSelected(null); }
      };
      if (catIndex === item.catIndex) {
        setScore((s) => s + 1);
        speak(`${item.name} เป็น${correctLabel} ถูกต้องเลย! เก่งมากเลย!`, "celebrating", advance);
      } else {
        speak(`${item.name} เป็น${correctLabel}นะ ไม่เป็นไร ลองใหม่ได้เลย!`, "thinking", advance);
      }
    },
    [selected, current, items, setIdx, speak]
  );

  if (setIdx === null) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <KidoGameOverlay emotion={emotion} message={message} />
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">เกมจัดหมวดหมู่</h1>
        <p className="text-gray-500 text-sm mb-6">แตะหมวดหมู่ที่ถูกต้องให้ภาพแต่ละชิ้น</p>
        <div className="grid gap-3">
          {SORT_SETS.map((set, i) => (
            <button
              key={i}
              onClick={() => startGame(i)}
              className="p-5 bg-white border-2 border-gray-100 rounded-2xl text-left hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center gap-4"
            >
              <span className="text-3xl">{set.categories[0].emoji} vs {set.categories[1].emoji}</span>
              <div>
                <div className="font-semibold text-gray-900">{set.name}</div>
                <div className="text-sm text-gray-400 mt-0.5">
                  {set.categories[0].items.length + set.categories[1].items.length} ไอเทม
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sortSet = SORT_SETS[setIdx];

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เก่งมาก! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{items.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= items.length - 1 ? "แยกหมวดหมู่เก่งมาก! 🌟" : score >= Math.floor(items.length / 2) ? "ดีมาก ฝึกต่อไปนะ" : "ลองอีกครั้งนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => startGame(setIdx)} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button
            onClick={() => { onComplete({ score, total: items.length }) }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> บันทึกเสร็จแล้ว
          </Button>
        </div>
        {nextGame && (
          <button
            onClick={() => onComplete({ score, total: items.length })}
            className={`w-full mt-5 rounded-3xl bg-gradient-to-br ${nextGame.color} p-5 flex items-center gap-4 shadow-lg active:scale-95 transition-transform text-left`}
          >
            <span className="text-5xl">{nextGame.emoji}</span>
            <div className="flex-1">
              <p className="text-white/70 text-xs mb-0.5">เกมถัดไป 🎯</p>
              <p className="text-white font-bold text-xl">{nextGame.label}</p>
              <p className="text-white/60 text-xs mt-0.5">แตะเพื่อเล่นเลย!</p>
            </div>
            <span className="text-white/80 text-3xl font-light">›</span>
          </button>
        )}
      </div>
    );
  }

  const item = items[current];
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <span className="text-sm text-gray-500">{current + 1} / {items.length}</span>
      </div>
      <Progress value={(current / items.length) * 100} className="mb-6 h-2" />

      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-3">นี่คืออะไร? ใส่ในหมวดไหน?</p>
        <div className="w-36 h-36 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex flex-col items-center justify-center gap-2 mx-auto shadow-sm">
          <span className="text-6xl">{item.emoji}</span>
          <span className="text-sm font-semibold text-gray-700">{item.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sortSet.categories.map((cat, ci) => {
          const isSelected = selected === ci;
          const isCorrect = ci === item.catIndex;
          let cls = "rounded-3xl py-8 flex flex-col items-center gap-2 transition-all border-2 ";
          if (selected !== null) {
            if (isCorrect) cls += "bg-green-100 border-green-400";
            else if (isSelected) cls += "bg-red-100 border-red-400";
            else cls += "opacity-40 bg-white border-gray-200";
          } else {
            cls += `bg-gradient-to-br ${cat.color} border-transparent cursor-pointer`;
          }
          return (
            <button key={ci} onClick={() => handleSort(ci)} className={cls}>
              <span className="text-4xl">{cat.emoji}</span>
              <span className={`font-bold text-lg ${selected !== null ? "text-gray-700" : "text-white"}`}>
                {cat.label}
              </span>
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
