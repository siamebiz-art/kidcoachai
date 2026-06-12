"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const COLORS = [
  { name: "แดง",     hex: "#ef4444" },
  { name: "น้ำเงิน", hex: "#3b82f6" },
  { name: "เขียว",   hex: "#22c55e" },
  { name: "เหลือง",  hex: "#eab308" },
  { name: "ส้ม",     hex: "#f97316" },
  { name: "ม่วง",    hex: "#a855f7" },
];

const SHAPES = [
  { name: "วงกลม",    path: (c: string) => <circle cx="50" cy="50" r="42" fill={c} /> },
  { name: "สี่เหลี่ยม", path: (c: string) => <rect x="8" y="8" width="84" height="84" rx="8" fill={c} /> },
  { name: "สามเหลี่ยม", path: (c: string) => <polygon points="50,6 94,94 6,94" fill={c} /> },
  { name: "ดาว",      path: (c: string) => <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={c} /> },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

type Item = { shapeIdx: number; colorIdx: number };
type Q = { target: Item; mode: "shape" | "color"; options: Item[] };

function randItem(exclude?: Item): Item {
  let s: Item;
  do { s = { shapeIdx: Math.floor(Math.random() * SHAPES.length), colorIdx: Math.floor(Math.random() * COLORS.length) }; }
  while (exclude && s.shapeIdx === exclude.shapeIdx && s.colorIdx === exclude.colorIdx);
  return s;
}

function buildQuestions(count = 10): Q[] {
  return Array.from({ length: count }, (_, i) => {
    const target = randItem();
    const mode: "shape" | "color" = i % 2 === 0 ? "shape" : "color";
    const wrongs: Item[] = [];
    while (wrongs.length < 3) {
      const w = mode === "shape"
        ? { shapeIdx: (target.shapeIdx + wrongs.length + 1) % SHAPES.length, colorIdx: target.colorIdx }
        : { shapeIdx: target.shapeIdx, colorIdx: (target.colorIdx + wrongs.length + 1) % COLORS.length };
      wrongs.push(w);
    }
    return { target, mode, options: shuffle([target, ...wrongs]) };
  });
}

function ShapeSVG({ item, size = 80 }: { item: Item; size?: number }) {
  const color = COLORS[item.colorIdx].hex;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {SHAPES[item.shapeIdx].path(color)}
    </svg>
  );
}

export function ShapesGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Q[]>(() => buildQuestions());
  const [index, setIndex]   = useState(0);
  const [score, setScore]   = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone]     = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    const q = questions[index];
    const target = q.target;
    const prefix = index === 0 ? "มาเริ่มเลย! " : "";
    const prompt = q.mode === "shape"
      ? `${prefix}ช่วยหา${SHAPES[target.shapeIdx].name}สีเดียวกันนี้ให้คิโด้หน่อยนะ!`
      : `${prefix}ช่วยหารูปทรงสี${COLORS[target.colorIdx].name}ให้คิโด้หน่อยนะ!`;
    speak(prompt, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องรู้จักรูปทรงและสีได้เก่งมาก! 🎨", "celebrating");
    }
  }, [done]); // eslint-disable-line

  const handlePick = useCallback((optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const q = questions[index];
    const opt = q.options[optIdx];
    const isCorrect = opt.shapeIdx === q.target.shapeIdx && opt.colorIdx === q.target.colorIdx;
    const advance = () => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex((i) => i + 1); setSelected(null); }
    };
    const colorName = COLORS[q.target.colorIdx].name;
    const shapeName = SHAPES[q.target.shapeIdx].name;
    if (isCorrect) {
      setScore((s) => s + 1);
      speak(`ใช่เลย! ${shapeName}สี${colorName} เก่งมากเลย!`, "celebrating", advance);
    } else {
      speak(`ยังไม่ใช่นะ ลองหา${q.mode === "shape" ? shapeName : `สี${colorName}`}อีกครั้ง!`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-blue-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">{score >= 8 ? "รู้จักรูปทรงได้เก่งมาก! 🌟" : score >= 5 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => { onComplete({ score, total: questions.length }); onBack(); }} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 rounded-xl gap-2">
            <CheckCircle2 className="w-4 h-4" /> บันทึก
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const label = q.mode === "shape"
    ? `หา${SHAPES[q.target.shapeIdx].name}สีเดียวกัน`
    : `หารูปทรงสี${COLORS[q.target.colorIdx].name}`;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /> กลับ</button>
        <span className="text-sm text-gray-500">ข้อ {index + 1}/{questions.length}</span>
      </div>
      <Progress value={(index / questions.length) * 100} className="mb-6 h-2" />

      <div className="text-center mb-6">
        <p className="text-gray-400 text-sm mb-3">{label}</p>
        <div className="flex justify-center"><ShapeSVG item={q.target} size={100} /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {q.options.map((opt, i) => {
          const isTarget = opt.shapeIdx === q.target.shapeIdx && opt.colorIdx === q.target.colorIdx;
          let cls = "aspect-square rounded-3xl flex items-center justify-center border-2 transition-all ";
          if (selected !== null) {
            if (isTarget) cls += "bg-green-100 border-green-400";
            else if (selected === i) cls += "bg-red-100 border-red-400";
            else cls += "bg-white border-gray-200 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
          }
          return (
            <button key={i} onClick={() => handlePick(i)} className={cls}>
              <ShapeSVG item={opt} size={70} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
