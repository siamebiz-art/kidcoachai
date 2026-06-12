"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

type Round = { items: string[]; labels: string[]; oddIndex: number; category: string };

const ROUNDS: Round[] = [
  { items: ["🍎","🍌","🍊","🚗"],     labels: ["แอปเปิ้ล","กล้วย","ส้ม","รถยนต์"],           oddIndex: 3, category: "ผลไม้" },
  { items: ["🐱","🐶","🐦","🪑"],     labels: ["แมว","หมา","นก","เก้าอี้"],                  oddIndex: 3, category: "สัตว์" },
  { items: ["✏️","📚","📏","🍕"],    labels: ["ดินสอ","หนังสือ","ไม้บรรทัด","พิซซ่า"],       oddIndex: 3, category: "อุปกรณ์เรียน" },
  { items: ["🚗","🚌","🛺","🏠"],     labels: ["รถยนต์","รถบัส","รถตุ๊กตุ๊ก","บ้าน"],         oddIndex: 3, category: "ยานพาหนะ" },
  { items: ["🍦","🍰","🎂","🥦"],     labels: ["ไอศกรีม","เค้กชิ้น","เค้กวันเกิด","บรอคโคลี่"], oddIndex: 3, category: "ของหวาน" },
  { items: ["👕","👗","🧥","🏀"],     labels: ["เสื้อยืด","ชุดเดรส","เสื้อโค้ต","บาสเกตบอล"],  oddIndex: 3, category: "เครื่องนุ่งห่ม" },
  { items: ["🎵","🎸","🥁","🥕"],     labels: ["โน้ต","กีตาร์","กลอง","แครอท"],               oddIndex: 3, category: "ดนตรี" },
  { items: ["🌹","🌻","🌸","🍋"],     labels: ["กุหลาบ","ทานตะวัน","ซากุระ","มะนาว"],          oddIndex: 3, category: "ดอกไม้" },
  { items: ["🐘","🦒","🦁","🦋"],     labels: ["ช้าง","ยีราฟ","สิงโต","ผีเสื้อ"],              oddIndex: 3, category: "สัตว์ป่า" },
  { items: ["⚽","🏈","🎾","📺"],     labels: ["ฟุตบอล","อเมริกันฟุตบอล","เทนนิส","โทรทัศน์"], oddIndex: 3, category: "กีฬา" },
  { items: ["🍚","🍜","🍳","🌵"],     labels: ["ข้าวสวย","บะหมี่","ไข่ดาว","กระบองเพชร"],     oddIndex: 3, category: "อาหาร" },
  { items: ["🔴","🔵","🟢","🐰"],     labels: ["วงกลมแดง","วงกลมน้ำเงิน","วงกลมเขียว","กระต่าย"], oddIndex: 3, category: "วงกลมสี" },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

function shuffleItems(round: Round): Round {
  const order = shuffle([0, 1, 2, 3]);
  return {
    ...round,
    items:    order.map((i) => round.items[i]),
    labels:   order.map((i) => round.labels[i]),
    oddIndex: order.indexOf(round.oddIndex),
  };
}

export function OddOneOutGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Round[]>(() => shuffle(ROUNDS).slice(0, 10).map(shuffleItems));
  const [index, setIndex]     = useState(0);
  const [score, setScore]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone]       = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    speak(`${index === 0 ? "มาเริ่มกันเลย! " : ""}หาตัวที่ไม่เข้าพวกกับตัวอื่นนะ!`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องช่างสังเกตและจับผิดเก่งมาก 🎉", "celebrating");
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
    if (idx === q.oddIndex) {
      setScore((s) => s + 1);
      speak(`ใช่เลย! ${q.labels[q.oddIndex]} ไม่ใช่${q.category} เก่งมาก!`, "celebrating", advance);
    } else {
      speak(`ยังไม่ใช่นะ ตัวที่ไม่เข้าพวกคือ ${q.labels[q.oddIndex]}`, "thinking", advance);
    }
  }, [selected, index, questions, speak]);

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 8 ? "สุดยอด! ช่างสังเกตมากเลย! 🌟" : score >= 5 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setSelected(null); setDone(false); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => onComplete({ score, total: questions.length })} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-xl gap-2">
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
      <Progress value={(index / questions.length) * 100} className="mb-6 h-2" />

      <p className="text-center text-gray-400 text-sm mb-6">แตะสิ่งที่ไม่เข้าพวกกับตัวอื่น</p>

      <div className="grid grid-cols-2 gap-4">
        {q.items.map((item, i) => {
          let cls = "py-6 rounded-3xl text-center border-2 transition-all flex flex-col items-center gap-2 ";
          if (selected !== null) {
            if (i === q.oddIndex) cls += "bg-green-100 border-green-400";
            else if (i === selected) cls += "bg-red-100 border-red-400 opacity-70";
            else cls += "bg-white border-gray-200 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer";
          }
          return (
            <button key={i} onClick={() => handlePick(i)} className={cls}>
              <span className="text-5xl">{item}</span>
              <span className="text-sm font-medium text-gray-700">{q.labels[i]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
