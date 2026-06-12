"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const SCENARIOS = [
  { situation: "เพื่อนหกล้มเจ็บ",                emoji: "😢", options: ["เป็นยังไงบ้าง?",           "แกนี่แกล้งทำ!",        "ฉันไม่สน",          "หัวเราะเลย"],       correct: 0 },
  { situation: "เพื่อนให้ขนมมาแบ่ง",             emoji: "🍬", options: ["เอาทั้งหมดเลย!",           "ขอบคุณมากนะ",          "ไม่อยากได้",        "โยนทิ้งเลย"],       correct: 1 },
  { situation: "เดินชนคนโดยบังเอิญ",             emoji: "😯", options: ["วิ่งหนีไปเลย",              "ขอโทษนะครับ/ค่ะ",      "โกรธมาก",           "เพิกเฉย"],          correct: 1 },
  { situation: "อยากเล่นของเล่นเพื่อน",           emoji: "🧸", options: ["แย่งมาเลย",                "ร้องไห้โวยวาย",        "ขอยืมเล่นด้วยได้ไหม?", "ขโมยเงียบๆ"],     correct: 2 },
  { situation: "เห็นคนแก่ยืนบนรถเมล์",           emoji: "👴", options: ["เพิกเฉย",                  "ยื่นโทรศัพท์ให้ดู",    "ลุกให้นั่งแทน",     "หลับตา"],           correct: 2 },
  { situation: "ตอบคำถามครูผิด",                   emoji: "🙋", options: ["โกรธครู",                  "รับรู้และพยักหน้า",    "ร้องไห้หนีออกไป",   "โทษเพื่อน"],        correct: 1 },
  { situation: "พี่ช่วยหยิบของให้",               emoji: "🙏", options: ["ไม่พูดอะไร",               "บอกว่าช้าจัง",         "ขอบคุณนะพี่",       "เดินไปเลย"],        correct: 2 },
  { situation: "เพื่อนเศร้าไม่พูดกับใคร",         emoji: "😔", options: ["แกล้งเล่น",                "นั่งเป็นเพื่อนและถามว่าเป็นไง", "เพิกเฉย", "เล่าให้คนอื่นฟัง"],   correct: 1 },
  { situation: "ทำของเสียโดยไม่ตั้งใจ",           emoji: "😟", options: ["ซ่อนไว้เฉยๆ",              "โทษคนอื่น",            "บอกความจริงและขอโทษ", "เพิกเฉย"],       correct: 2 },
  { situation: "เจอเพื่อนที่รู้จักในร้าน",         emoji: "👋", options: ["ก้มหน้าเดินผ่าน",          "ทักทายยิ้มแย้ม",       "วิ่งหนี",           "ทำหน้าบึ้ง"],       correct: 1 },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }
type Q = (typeof SCENARIOS)[0];

export function DialogueGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Q[]>(() => shuffle(SCENARIOS).slice(0, 8));
  const [index, setIndex]     = useState(0);
  const [score, setScore]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone]       = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    speak(`${index === 0 ? "มาเริ่มกันเลย! " : ""}ถ้า${questions[index].situation} ควรทำอะไร?`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องรู้จักวิธีปฏิบัติตัวในสังคมได้ดีมาก 🎉", "celebrating");
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
      speak(`ถูกต้องเลย! "${q.options[q.correct]}" เป็นสิ่งที่ดีที่สุด เก่งมาก!`, "celebrating", advance);
    } else {
      speak(`ที่ดีกว่าคือ "${q.options[q.correct]}" ลองจำไว้นะ`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-sky-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 6 ? "เก่งมากเลย เข้าใจสังคมดีมาก! 🌟" : score >= 4 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => onComplete({ score, total: questions.length })} className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white border-0 rounded-xl gap-2">
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
            cls += "bg-white border-gray-200 hover:border-sky-300 hover:bg-sky-50 text-gray-800 cursor-pointer";
          }
          return <button key={i} onClick={() => handlePick(i)} className={cls}>{opt}</button>;
        })}
      </div>
    </div>
  );
}
