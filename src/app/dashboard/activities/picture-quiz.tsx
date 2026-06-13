"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, CheckCircle2, RotateCcw } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import { CorrectEffect } from "@/components/kido/correct-effect";
import { useCorrectEffect } from "@/hooks/use-correct-effect";
import type { GameResult } from "@/lib/types";

const ALL_VOCAB = [
  // สัตว์ → ตัว
  { emoji: "🐱", word: "แมว",           classifier: "ตัว" },
  { emoji: "🐶", word: "หมา",           classifier: "ตัว" },
  { emoji: "🐸", word: "กบ",            classifier: "ตัว" },
  { emoji: "🐰", word: "กระต่าย",      classifier: "ตัว" },
  { emoji: "🐻", word: "หมี",           classifier: "ตัว" },
  { emoji: "🦁", word: "สิงโต",        classifier: "ตัว" },
  { emoji: "🐮", word: "วัว",           classifier: "ตัว" },
  { emoji: "🐷", word: "หมู",           classifier: "ตัว" },
  { emoji: "🐟", word: "ปลา",          classifier: "ตัว" },
  { emoji: "🐘", word: "ช้าง",         classifier: "ตัว" },
  // ผลไม้ → ลูก
  { emoji: "🍎", word: "แอปเปิ้ล",    classifier: "ลูก" },
  { emoji: "🍌", word: "กล้วย",        classifier: "ลูก" },
  { emoji: "🍊", word: "ส้ม",          classifier: "ลูก" },
  { emoji: "🍇", word: "องุ่น",        classifier: "ลูก" },
  { emoji: "🍓", word: "สตรอว์เบอร์รี่", classifier: "ลูก" },
  { emoji: "🍉", word: "แตงโม",        classifier: "ลูก" },
  { emoji: "🥭", word: "มะม่วง",       classifier: "ลูก" },
  { emoji: "🍍", word: "สับปะรด",      classifier: "ลูก" },
  // สิ่งของ → ลักษณะนามเฉพาะ
  { emoji: "📚", word: "หนังสือ",       classifier: "เล่ม" },
  { emoji: "✏️", word: "ดินสอ",        classifier: "แท่ง" },
  { emoji: "🎒", word: "กระเป๋า",      classifier: "ใบ"   },
  { emoji: "🚗", word: "รถ",           classifier: "คัน"  },
  { emoji: "🏠", word: "บ้าน",         classifier: "หลัง" },
  { emoji: "☀️", word: "ดวงอาทิตย์",  classifier: "ดวง"  },
  { emoji: "🌙", word: "พระจันทร์",    classifier: "ดวง"  },
  { emoji: "⭐", word: "ดาว",          classifier: "ดวง"  },
];

type Question = { prompt: string; classifier: string; correct: string; options: string[] };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(count = 10): Question[] {
  const pool = shuffle(ALL_VOCAB);
  return pool.slice(0, count).map((item) => {
    const wrong = shuffle(ALL_VOCAB.filter((p) => p.emoji !== item.emoji)).slice(0, 3);
    return {
      prompt:     item.word,
      classifier: item.classifier,
      correct:    item.emoji,
      options:    shuffle([item, ...wrong]).map((o) => o.emoji),
    };
  });
}

export function PictureQuizGame({ onBack, onComplete }: { onBack: () => void; onComplete: (result?: GameResult) => void }) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const { effectKey, trigger } = useCorrectEffect();
  const announcedDone = useRef(false);

  // Kido speaks each question aloud
  useEffect(() => {
    if (done) return;
    const { prompt, classifier } = questions[index];
    const prefix = index === 0 ? "มาเริ่มเลย! " : "";
    speak(`${prefix}${prompt}${classifier}ไหนนะ? ลองชี้ให้คิโด้ดูหน่อย!`, "talking");
  }, [index, done]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! น้องรู้จักคำศัพท์เยอะมากเลย! 🏆", "celebrating");
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setQuestions(buildQuestions());
    setIndex(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  }

  const handlePick = useCallback(
    (emoji: string) => {
      if (selected !== null) return;
      setSelected(emoji);
      const word = questions[index].prompt;
      const advance = () => {
        if (index + 1 >= questions.length) setDone(true);
        else { setIndex((i) => i + 1); setSelected(null); }
      };
      const cl = questions[index].classifier;
      if (emoji === questions[index].correct) {
        setScore((s) => s + 1);
        trigger();
        speak(`ใช่เลย! นั่นแหละ${word}${cl}นั้น เก่งมากเลย!`, "celebrating", advance);
      } else {
        speak(`ยังไม่ใช่นะ ลองหา${word}สัก${cl}อีกครั้งนะ!`, "thinking", advance);
      }
    },
    [selected, index, questions, speak]
  );

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">จบแล้ว! 🎉</h2>
        <p className="text-gray-500 mb-1">คะแนนของลูก</p>
        <p className="text-purple-600 font-bold text-4xl mb-2">{score}/{questions.length}</p>
        <p className="text-gray-400 text-sm mb-6">
          {score >= 8 ? "เก่งมากเลย! 🌟" : score >= 5 ? "ดีมาก ลองอีกครั้งนะ" : "ฝึกต่อไปนะ 💪"}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={restart} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button
            onClick={() => onComplete({ score, total: questions.length })}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> บันทึกเสร็จแล้ว
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <CorrectEffect effectKey={effectKey} />
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <span className="text-sm text-gray-500">ข้อ {index + 1} / {questions.length}</span>
      </div>
      <Progress value={(index / questions.length) * 100} className="mb-8 h-2" />

      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-2">ชี้รูปที่ถูกต้อง</p>
        <h2 className="text-5xl font-bold text-gray-900">{q.prompt}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {q.options.map((emoji) => {
          const isSelected = selected === emoji;
          const isCorrect = emoji === q.correct;
          let cls = "aspect-square rounded-3xl flex items-center justify-center text-7xl transition-all border-2 ";
          if (selected !== null) {
            if (isCorrect) cls += "bg-green-100 border-green-400";
            else if (isSelected) cls += "bg-red-100 border-red-400";
            else cls += "bg-white border-gray-200 opacity-40";
          } else {
            cls += "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer";
          }
          return (
            <button key={emoji} onClick={() => handlePick(emoji)} className={cls}>
              {emoji}
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
