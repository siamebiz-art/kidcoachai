"use client";

import { useState, useCallback, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import type { GameResult } from "@/lib/types";

const COLORS = {
  red:    { name: "สีแดง",      bg: "bg-red-500",    border: "border-red-400",    text: "text-white"     },
  blue:   { name: "สีน้ำเงิน", bg: "bg-blue-600",   border: "border-blue-500",   text: "text-white"     },
  green:  { name: "สีเขียว",   bg: "bg-green-500",  border: "border-green-400",  text: "text-white"     },
  yellow: { name: "สีเหลือง",  bg: "bg-yellow-400", border: "border-yellow-300", text: "text-gray-800"  },
  orange: { name: "สีส้ม",     bg: "bg-orange-500", border: "border-orange-400", text: "text-white"     },
  purple: { name: "สีม่วง",    bg: "bg-purple-600", border: "border-purple-500", text: "text-white"     },
  pink:   { name: "สีชมพู",    bg: "bg-pink-400",   border: "border-pink-300",   text: "text-white"     },
  white:  { name: "สีขาว",     bg: "bg-white",      border: "border-gray-300",   text: "text-gray-800"  },
  black:  { name: "สีดำ",      bg: "bg-gray-900",   border: "border-gray-700",   text: "text-white"     },
  brown:  { name: "สีน้ำตาล",  bg: "bg-amber-700",  border: "border-amber-600",  text: "text-white"     },
} as const;

type ColorKey = keyof typeof COLORS;

const ITEMS: { emoji: string; label: string; color: ColorKey }[] = [
  { emoji: "👕", label: "เสื้อ",         color: "red"    },
  { emoji: "👖", label: "กางเกง",        color: "blue"   },
  { emoji: "🎒", label: "กระเป๋า",      color: "orange" },
  { emoji: "👟", label: "รองเท้า",      color: "white"  },
  { emoji: "🎩", label: "หมวก",          color: "black"  },
  { emoji: "👗", label: "ชุดเดรส",      color: "pink"   },
  { emoji: "🧥", label: "แจ็คเก็ต",    color: "brown"  },
  { emoji: "🧤", label: "ถุงมือ",       color: "yellow" },
  { emoji: "🧣", label: "ผ้าพันคอ",    color: "purple" },
  { emoji: "🎈", label: "ลูกโป่ง",     color: "red"    },
  { emoji: "🌂", label: "ร่ม",          color: "blue"   },
  { emoji: "🚗", label: "รถยนต์",      color: "green"  },
  { emoji: "📗", label: "หนังสือ",     color: "green"  },
  { emoji: "🪑", label: "เก้าอี้",     color: "brown"  },
  { emoji: "🎀", label: "ริบบิ้น",     color: "pink"   },
  { emoji: "🧦", label: "ถุงเท้า",     color: "yellow" },
  { emoji: "🎁", label: "กล่องของขวัญ", color: "red"   },
  { emoji: "🎓", label: "หมวกวิชาการ", color: "black"  },
  { emoji: "🧸", label: "ตุ๊กตาหมี",  color: "brown"  },
  { emoji: "⛺", label: "เต็นท์",      color: "orange" },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type Round = { emoji: string; label: string; color: ColorKey; options: ColorKey[] };

function buildRounds(total = 15): Round[] {
  const colorKeys = Object.keys(COLORS) as ColorKey[];
  return shuffle(ITEMS).slice(0, total).map((item) => {
    const wrongs = shuffle(colorKeys.filter((c) => c !== item.color)).slice(0, 3);
    return { ...item, options: shuffle([item.color, ...wrongs]) };
  });
}

export function ColorGame({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (result?: GameResult) => void;
}) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<ColorKey | null>(null);
  const [done, setDone] = useState(false);
  const { emotion, message, speak } = useKidoVoice();

  useEffect(() => {
    setRounds(buildRounds());
    speak("มาเรียนรู้สีกัน! ดูของแล้วบอกว่าสีอะไรนะ 🎨", "talking");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rounds.length === 0 || done) return;
    const r = rounds[index];
    speak(`${r.label}สีอะไร? ลองทายดูนะ!`, "talking");
  }, [index, done, rounds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done) speak("เก่งมากเลย! รู้จักสีเยอะมาก! 🏆", "celebrating");
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = useCallback(
    (colorKey: ColorKey) => {
      if (selected !== null) return;
      setSelected(colorKey);
      const round = rounds[index];
      const correct = round.color;
      const colorName = COLORS[correct].name;
      const advance = () => {
        if (index + 1 >= rounds.length) setDone(true);
        else { setIndex((i) => i + 1); setSelected(null); }
      };
      if (colorKey === correct) {
        setScore((s) => s + 1);
        speak(`ถูกต้อง! ${round.label}${colorName}เลย เก่งมาก!`, "celebrating", advance);
      } else {
        speak(`ยังไม่ใช่นะ ${round.label}${colorName}นะ ลองดูอีกครั้ง!`, "thinking", advance);
      }
    },
    [selected, index, rounds, speak]
  );

  function restart() {
    setRounds(buildRounds());
    setIndex(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }

  if (rounds.length === 0) return null;

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เก่งมากเลย! 🎨</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{rounds.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 12 ? "รู้จักสีเก่งมากเลย! 🌟" : score >= 8 ? "ดีมาก ฝึกต่อไปนะ" : "ลองอีกครั้งนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={restart} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button
            onClick={() => onComplete({ score, total: rounds.length })}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> บันทึกเสร็จแล้ว
          </Button>
        </div>
      </div>
    );
  }

  const round = rounds[index];
  const correctColor = COLORS[round.color];

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

      <p className="text-center text-xl font-bold text-gray-800 mb-5">
        {round.label}สีอะไร?
      </p>

      {/* Object on colored background */}
      <div className="flex justify-center mb-8">
        <div className={`w-44 h-44 rounded-3xl ${correctColor.bg} border-4 ${correctColor.border} flex items-center justify-center shadow-xl`}>
          <span className="text-8xl drop-shadow-md">{round.emoji}</span>
        </div>
      </div>

      {/* Color choice buttons */}
      <div className="grid grid-cols-2 gap-3">
        {round.options.map((colorKey) => {
          const c = COLORS[colorKey];
          const isSelected = selected === colorKey;
          const isCorrect = colorKey === round.color;
          let extra = "";
          if (selected !== null) {
            if (isCorrect) extra = "ring-4 ring-green-400 ring-offset-2 scale-105";
            else if (isSelected) extra = "ring-4 ring-red-400 ring-offset-2 opacity-50";
            else extra = "opacity-40";
          }
          return (
            <button
              key={colorKey}
              onClick={() => handlePick(colorKey)}
              disabled={selected !== null}
              className={`${c.bg} ${c.border} border-2 rounded-2xl py-4 px-3 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${extra}`}
            >
              <span className={`font-bold text-base ${c.text}`}>{c.name}</span>
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
