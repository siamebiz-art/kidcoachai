"use client";

import { useState, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const SEQUENCES = [
  { title: "ตื่นนอนตอนเช้า", steps: [{ emoji: "😴", label: "ตื่นนอน" }, { emoji: "🦷", label: "แปรงฟัน" }, { emoji: "🍳", label: "กินข้าวเช้า" }, { emoji: "🎒", label: "ไปโรงเรียน" }] },
  { title: "ล้างมือ", steps: [{ emoji: "🚿", label: "เปิดน้ำ" }, { emoji: "🧼", label: "ใส่สบู่" }, { emoji: "👐", label: "ถูมือ" }, { emoji: "🌬️", label: "เช็ดมือ" }] },
  { title: "ต้นไม้เติบโต", steps: [{ emoji: "🌱", label: "เมล็ด" }, { emoji: "🌿", label: "ต้นเล็ก" }, { emoji: "🌳", label: "ต้นใหญ่" }, { emoji: "🍎", label: "ออกผล" }] },
  { title: "ทำการบ้าน", steps: [{ emoji: "📖", label: "เปิดหนังสือ" }, { emoji: "✏️", label: "เขียน" }, { emoji: "✅", label: "ตรวจ" }, { emoji: "🎮", label: "เล่นพัก" }] },
  { title: "กลางวันถึงกลางคืน", steps: [{ emoji: "☀️", label: "เช้า" }, { emoji: "🌤️", label: "สาย" }, { emoji: "🌆", label: "เย็น" }, { emoji: "🌙", label: "กลางคืน" }] },
  { title: "อาบน้ำ", steps: [{ emoji: "🛁", label: "เปิดน้ำ" }, { emoji: "🧴", label: "ใช้สบู่" }, { emoji: "💧", label: "ล้างออก" }, { emoji: "🧖", label: "เช็ดตัว" }] },
  { title: "ปลูกผัก", steps: [{ emoji: "🕳️", label: "ขุดหลุม" }, { emoji: "🌰", label: "ใส่เมล็ด" }, { emoji: "💧", label: "รดน้ำ" }, { emoji: "🥕", label: "เก็บเกี่ยว" }] },
];

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

type Step = { emoji: string; label: string };
type Q = { title: string; steps: Step[]; shuffled: Step[] };

function buildQuestions(): Q[] {
  return shuffle(SEQUENCES).slice(0, 5).map((s) => ({ ...s, shuffled: shuffle(s.steps) }));
}

export function SequenceGame({ onBack, onComplete }: { onBack: () => void; onComplete: (r?: GameResult) => void }) {
  const [questions] = useState<Q[]>(() => buildQuestions());
  const [index, setIndex]   = useState(0);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);
  const [order, setOrder]   = useState<Step[]>([]);
  const [pool, setPool]     = useState<Step[]>([]);
  const [checking, setChecking] = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    const q = questions[index];
    setOrder([]);
    setPool(q.shuffled);
    const prefix = index === 0 ? "มาเริ่มกันเลย! " : "";
    speak(`${prefix}ช่วยเรียงลำดับ${q.title}ให้ถูกต้องนะ!`, "talking");
  }, [index, done]); // eslint-disable-line

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องเรียงลำดับได้ดีมาก! 🏆", "celebrating");
    }
  }, [done]); // eslint-disable-line

  function pickStep(step: Step) {
    if (checking) return;
    setPool((p) => p.filter((s) => s !== step));
    const newOrder = [...order, step];
    setOrder(newOrder);

    if (newOrder.length === questions[index].steps.length) {
      setChecking(true);
      const correct = questions[index].steps;
      const isCorrect = newOrder.every((s, i) => s.label === correct[i].label);
      const advance = () => {
        setChecking(false);
        if (index + 1 >= questions.length) setDone(true);
        else setIndex((i) => i + 1);
      };
      if (isCorrect) {
        setScore((s) => s + 1);
        speak("ถูกต้องทุกขั้นตอนเลย! เก่งมากๆ!", "celebrating", advance);
      } else {
        speak("ลำดับยังไม่ถูกนะ ลองใหม่อีกครั้งนะ!", "thinking", () => {
          setOrder([]);
          setPool(questions[index].shuffled);
          setChecking(false);
        });
      }
    }
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-teal-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-teal-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">{score >= 4 ? "เรียงลำดับได้เก่งมาก! 🌟" : score >= 2 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIndex(0); setScore(0); setDone(false); setOrder([]); }} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button onClick={() => { onComplete({ score, total: questions.length }); onBack(); }} className="flex-1 bg-gradient-to-r from-teal-500 to-green-500 text-white border-0 rounded-xl gap-2">
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
      <Progress value={(index / questions.length) * 100} className="mb-6 h-2" />

      <p className="text-center text-gray-500 text-sm mb-2">เรียงลำดับ: <strong>{q.title}</strong></p>

      {/* Answer area */}
      <div className="flex gap-2 justify-center mb-6 min-h-[90px] bg-gray-50 rounded-2xl p-3 border-2 border-dashed border-gray-200">
        {order.length === 0 && <p className="text-gray-300 text-sm self-center">แตะขั้นตอนด้านล่างเพื่อเรียง</p>}
        {order.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1 bg-white rounded-xl px-3 py-2 shadow-sm border border-teal-200">
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-xs text-gray-600 font-medium">{i + 1}. {s.label}</span>
          </div>
        ))}
      </div>

      {/* Pool */}
      <div className="flex gap-3 flex-wrap justify-center">
        {pool.map((s, i) => (
          <button
            key={i}
            onClick={() => pickStep(s)}
            disabled={checking}
            className="flex flex-col items-center gap-1 bg-white rounded-2xl px-4 py-3 shadow-sm border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all disabled:opacity-40 cursor-pointer"
          >
            <span className="text-4xl">{s.emoji}</span>
            <span className="text-xs text-gray-600 font-medium">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
