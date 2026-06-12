"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const NEEDS = [
  { emoji: "😋", situation: "หิวข้าว",               options: ["หนูหิวข้าวแล้วค่ะ",    "ฉันไม่อยากกิน",        "นอนดีกว่า",         "วิ่งเล่นต่อ"],       correct: 0 },
  { emoji: "😴", situation: "ง่วงนอนมาก",            options: ["หนูอยากเล่นต่อ",        "หนูง่วงนอนแล้วค่ะ",    "ดูทีวีต่อ",         "ร้องไห้"],           correct: 1 },
  { emoji: "🥵", situation: "ร้อนมากในห้อง",          options: ["นั่งเฉยๆ",              "เปิดพัดลม หรือบอกผู้ใหญ่", "ใส่เสื้อหนาขึ้น", "วิ่งออกนอกบ้าน"],    correct: 1 },
  { emoji: "🤕", situation: "หกล้มเจ็บเข่า",          options: ["ร้องไห้คนเดียว",        "เดินหนีไป",            "บอกคุณแม่ว่าเจ็บ",  "แกล้งทำเป็นไม่เจ็บ"], correct: 2 },
  { emoji: "😟", situation: "ไม่เข้าใจการบ้าน",        options: ["ทำโกรธ ขีดกระดาษ",     "ถามครูหรือพ่อแม่",     "ส่งเปล่าๆ",         "ไม่ทำเลย"],          correct: 1 },
  { emoji: "🥺", situation: "รู้สึกเหงา อยากเล่นกับเพื่อน", options: ["นั่งเศร้าคนเดียว", "แย่งของเล่นเพื่อน",    "ชวนเพื่อนเล่นด้วย", "ร้องไห้"],           correct: 2 },
  { emoji: "😬", situation: "กลัวมืดตอนกลางคืน",      options: ["ซ่อนใต้ผ้า",           "ร้องไห้เงียบๆ",        "บอกพ่อแม่ว่ากลัว",  "ฝืนทนอยู่คนเดียว"],  correct: 2 },
  { emoji: "🤢", situation: "ท้องปั่นป่วน คลื่นไส้",   options: ["กินขนมต่อ",            "บอกผู้ใหญ่ว่าไม่สบาย", "วิ่งเล่นต่อ",       "นอนกับพื้น"],        correct: 1 },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }
type Q = (typeof NEEDS)[0];

export function NeedsGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Q[]>(() => shuffle(NEEDS));
  const [index, setIndex]     = useState(0);
  const [score, setScore]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone]       = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    const q = questions[index];
    speak(`${index === 0 ? "มาเริ่มกันเลย! " : ""}ถ้า${q.situation} ควรทำอะไร?`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องรู้วิธีบอกความต้องการตัวเองได้ดีมาก 💪", "celebrating");
    }
  }, [done]); // eslint-disable-line

  const handlePick = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[index];
    const advance = () => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex((i) => i + 1); setSelected(null); }
    };
    if (idx === q.correct) {
      setScore((s) => s + 1);
      speak(`ถูกต้อง! "${q.options[q.correct]}" นั่นแหละที่ควรทำ เก่งมาก!`, "celebrating", advance);
    } else {
      speak(`ที่ดีกว่าคือ "${q.options[q.correct]}" ลองจำไว้นะ`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 6 ? "สุดยอด! รู้จักบอกความต้องการตัวเองได้ดีมาก 🌟" : score >= 4 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => onComplete({ score, total: questions.length })} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 rounded-xl gap-2">
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
        <div className="text-6xl mb-3">{q.emoji}</div>
        <p className="text-lg font-semibold text-gray-800 mb-1">{q.situation}</p>
        <p className="text-sm text-gray-400">ควรทำอะไรดี?</p>
      </div>

      <div className="flex flex-col gap-3">
        {q.options.map((opt, i) => {
          let cls = "py-4 px-5 rounded-2xl text-base font-medium border-2 transition-all text-left ";
          if (selected !== null) {
            if (i === q.correct) cls += "bg-green-100 border-green-400 text-green-800";
            else if (i === selected) cls += "bg-red-100 border-red-400 text-red-800 opacity-70";
            else cls += "bg-white border-gray-200 text-gray-400 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-800 cursor-pointer";
          }
          return <button key={i} onClick={() => handlePick(i)} className={cls}>{opt}</button>;
        })}
      </div>
    </div>
  );
}
