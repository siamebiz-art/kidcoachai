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

type VocabItem = { emoji: string; word: string; classifier: string };

/* ─── vocabulary banks ─── */

const VOCAB_MIXED: VocabItem[] = [
  { emoji: "🐱", word: "แมว",            classifier: "ตัว"   },
  { emoji: "🐶", word: "หมา",            classifier: "ตัว"   },
  { emoji: "🐸", word: "กบ",             classifier: "ตัว"   },
  { emoji: "🐰", word: "กระต่าย",       classifier: "ตัว"   },
  { emoji: "🐻", word: "หมี",            classifier: "ตัว"   },
  { emoji: "🦁", word: "สิงโต",         classifier: "ตัว"   },
  { emoji: "🐮", word: "วัว",            classifier: "ตัว"   },
  { emoji: "🐷", word: "หมู",            classifier: "ตัว"   },
  { emoji: "🐟", word: "ปลา",           classifier: "ตัว"   },
  { emoji: "🐘", word: "ช้าง",          classifier: "ตัว"   },
  { emoji: "🍎", word: "แอปเปิ้ล",     classifier: "ลูก"   },
  { emoji: "🍌", word: "กล้วย",         classifier: "ลูก"   },
  { emoji: "🍊", word: "ส้ม",           classifier: "ลูก"   },
  { emoji: "🍇", word: "องุ่น",         classifier: "ลูก"   },
  { emoji: "🍓", word: "สตรอว์เบอร์รี่", classifier: "ลูก"  },
  { emoji: "🍉", word: "แตงโม",         classifier: "ลูก"   },
  { emoji: "🥭", word: "มะม่วง",        classifier: "ลูก"   },
  { emoji: "🍍", word: "สับปะรด",       classifier: "ลูก"   },
  { emoji: "📚", word: "หนังสือ",        classifier: "เล่ม"  },
  { emoji: "✏️", word: "ดินสอ",         classifier: "แท่ง"  },
  { emoji: "🎒", word: "กระเป๋า",       classifier: "ใบ"    },
  { emoji: "🚗", word: "รถ",            classifier: "คัน"   },
  { emoji: "🏠", word: "บ้าน",          classifier: "หลัง"  },
  { emoji: "☀️", word: "ดวงอาทิตย์",   classifier: "ดวง"   },
  { emoji: "🌙", word: "พระจันทร์",     classifier: "ดวง"   },
  { emoji: "⭐", word: "ดาว",           classifier: "ดวง"   },
];

const VOCAB_FRUITS: VocabItem[] = [
  { emoji: "🍎", word: "แอปเปิ้ล",       classifier: "ลูก" },
  { emoji: "🍌", word: "กล้วย",           classifier: "ลูก" },
  { emoji: "🍊", word: "ส้ม",             classifier: "ลูก" },
  { emoji: "🍇", word: "องุ่น",           classifier: "ลูก" },
  { emoji: "🍓", word: "สตรอว์เบอร์รี่",  classifier: "ลูก" },
  { emoji: "🍉", word: "แตงโม",           classifier: "ลูก" },
  { emoji: "🥭", word: "มะม่วง",          classifier: "ลูก" },
  { emoji: "🍍", word: "สับปะรด",         classifier: "ลูก" },
  { emoji: "🍑", word: "ลูกพีช",          classifier: "ลูก" },
  { emoji: "🍋", word: "มะนาว",           classifier: "ลูก" },
  { emoji: "🍒", word: "เชอร์รี่",        classifier: "ลูก" },
  { emoji: "🥝", word: "กีวี",            classifier: "ลูก" },
  { emoji: "🍐", word: "ลูกแพร์",         classifier: "ลูก" },
  { emoji: "🥥", word: "มะพร้าว",         classifier: "ลูก" },
  { emoji: "🍈", word: "แตงกวา",          classifier: "ลูก" },
];

const VOCAB_PETS: VocabItem[] = [
  { emoji: "🐱", word: "แมว",         classifier: "ตัว" },
  { emoji: "🐶", word: "หมา",         classifier: "ตัว" },
  { emoji: "🐰", word: "กระต่าย",    classifier: "ตัว" },
  { emoji: "🐹", word: "แฮมสเตอร์", classifier: "ตัว" },
  { emoji: "🐠", word: "ปลาสวยงาม", classifier: "ตัว" },
  { emoji: "🦜", word: "นกแก้ว",    classifier: "ตัว" },
  { emoji: "🐢", word: "เต่า",       classifier: "ตัว" },
  { emoji: "🐓", word: "ไก่",        classifier: "ตัว" },
  { emoji: "🦆", word: "เป็ด",       classifier: "ตัว" },
  { emoji: "🐦", word: "นก",         classifier: "ตัว" },
  { emoji: "🐟", word: "ปลา",        classifier: "ตัว" },
  { emoji: "🦋", word: "ผีเสื้อ",   classifier: "ตัว" },
  { emoji: "🐇", word: "กระต่ายขาว", classifier: "ตัว" },
  { emoji: "🐌", word: "หอยทาก",   classifier: "ตัว" },
];

const VOCAB_HOUSEHOLD: VocabItem[] = [
  { emoji: "📺", word: "ทีวี",         classifier: "เครื่อง" },
  { emoji: "📱", word: "โทรศัพท์",   classifier: "เครื่อง" },
  { emoji: "🪑", word: "เก้าอี้",    classifier: "ตัว"     },
  { emoji: "🚪", word: "ประตู",       classifier: "บาน"     },
  { emoji: "🪞", word: "กระจก",      classifier: "บาน"     },
  { emoji: "🧹", word: "ไม้กวาด",   classifier: "ด้าม"    },
  { emoji: "🍳", word: "กระทะ",      classifier: "ใบ"      },
  { emoji: "💡", word: "หลอดไฟ",    classifier: "ดวง"     },
  { emoji: "🖥️", word: "คอมพิวเตอร์", classifier: "เครื่อง" },
  { emoji: "🫖", word: "กาน้ำ",     classifier: "ใบ"      },
  { emoji: "🧺", word: "ตะกร้า",     classifier: "ใบ"      },
  { emoji: "🛒", word: "รถเข็น",     classifier: "คัน"     },
  { emoji: "🪣", word: "ถัง",        classifier: "ใบ"      },
  { emoji: "🧲", word: "แม่เหล็ก",  classifier: "ชิ้น"    },
  { emoji: "🕰️", word: "นาฬิกาแขวน", classifier: "เรือน"  },
];

const VOCAB_SCHOOL: VocabItem[] = [
  { emoji: "✏️", word: "ดินสอ",           classifier: "แท่ง" },
  { emoji: "📚", word: "หนังสือ",         classifier: "เล่ม" },
  { emoji: "📏", word: "ไม้บรรทัด",      classifier: "อัน"  },
  { emoji: "✂️", word: "กรรไกร",         classifier: "เล่ม" },
  { emoji: "🖊️", word: "ปากกา",         classifier: "ด้าม" },
  { emoji: "🖍️", word: "สีเทียน",       classifier: "แท่ง" },
  { emoji: "📌", word: "เข็มหมุด",      classifier: "อัน"  },
  { emoji: "📓", word: "สมุด",           classifier: "เล่ม" },
  { emoji: "🎒", word: "กระเป๋านักเรียน", classifier: "ใบ"  },
  { emoji: "📐", word: "ฉากสามเหลี่ยม", classifier: "อัน"  },
  { emoji: "📎", word: "คลิปหนีบกระดาษ", classifier: "อัน"  },
  { emoji: "📝", word: "กระดาษ",         classifier: "แผ่น" },
  { emoji: "🖌️", word: "พู่กัน",        classifier: "อัน"  },
  { emoji: "🗑️", word: "ถังขยะ",        classifier: "ใบ"   },
];

const VOCAB_PERSONAL: VocabItem[] = [
  { emoji: "🪥", word: "แปรงสีฟัน",  classifier: "อัน"   },
  { emoji: "🧼", word: "สบู่",        classifier: "ก้อน"  },
  { emoji: "🧴", word: "แชมพู",       classifier: "ขวด"   },
  { emoji: "👓", word: "แว่นตา",     classifier: "อัน"   },
  { emoji: "👟", word: "รองเท้า",    classifier: "คู่"   },
  { emoji: "👕", word: "เสื้อ",      classifier: "ตัว"   },
  { emoji: "👖", word: "กางเกง",     classifier: "ตัว"   },
  { emoji: "🧣", word: "ผ้าพันคอ",  classifier: "ผืน"   },
  { emoji: "⌚", word: "นาฬิกา",    classifier: "เรือน" },
  { emoji: "🧢", word: "หมวกแก็ป",  classifier: "ใบ"    },
  { emoji: "🧤", word: "ถุงมือ",     classifier: "คู่"   },
  { emoji: "🧦", word: "ถุงเท้า",   classifier: "คู่"   },
  { emoji: "🎒", word: "กระเป๋า",   classifier: "ใบ"    },
  { emoji: "💊", word: "ยา",         classifier: "เม็ด"  },
];

const VOCAB_BY_CATEGORY: Record<string, VocabItem[]> = {
  mixed:     VOCAB_MIXED,
  fruits:    VOCAB_FRUITS,
  pets:      VOCAB_PETS,
  household: VOCAB_HOUSEHOLD,
  school:    VOCAB_SCHOOL,
  personal:  VOCAB_PERSONAL,
};

const CATEGORY_META: Record<string, { title: string; intro: string; doneMsg: string }> = {
  mixed:     { title: "ชี้รูปภาพ",           intro: "มาชี้รูปภาพกัน! น้องรู้จักคำศัพท์อะไรบ้างนะ? 🌟",       doneMsg: "น้องรู้จักคำศัพท์เยอะมากเลย!" },
  fruits:    { title: "ชี้รูปผลไม้",         intro: "มาชี้รูปผลไม้กัน! น้องรู้จักผลไม้อะไรบ้างนะ? 🍎",      doneMsg: "น้องรู้จักผลไม้เยอะมากเลย!" },
  pets:      { title: "ชี้รูปสัตว์เลี้ยง",  intro: "มาชี้สัตว์เลี้ยงกัน! น้องชอบสัตว์ตัวไหนนะ? 🐾",       doneMsg: "น้องรู้จักสัตว์เลี้ยงเยอะมากเลย!" },
  household: { title: "ชี้รูปของในบ้าน",    intro: "มาชี้ของในบ้านกัน! น้องรู้จักของพวกนี้ไหมนะ? 🏠",      doneMsg: "น้องรู้จักของในบ้านเยอะมากเลย!" },
  school:    { title: "ชี้อุปกรณ์การเรียน", intro: "มาชี้อุปกรณ์การเรียนกัน! น้องใช้ของพวกนี้ที่โรงเรียน! 📚", doneMsg: "น้องรู้จักอุปกรณ์การเรียนเก่งมาก!" },
  personal:  { title: "ชี้รูปของใช้ตัวเอง", intro: "มาชี้ของใช้ส่วนตัวกัน! น้องใช้ของพวกนี้ทุกวันเลยนะ? 🧼", doneMsg: "น้องรู้จักของใช้ส่วนตัวดีมากเลย!" },
};

/* ─── types ─── */

type Question = { prompt: string; classifier: string; correct: string; options: string[] };

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(vocab: VocabItem[], count = 10): Question[] {
  const pool = shuffle(vocab).slice(0, Math.min(count, vocab.length));
  return pool.map((item) => {
    const wrong = shuffle(vocab.filter((p) => p.emoji !== item.emoji)).slice(0, 3);
    return {
      prompt:     item.word,
      classifier: item.classifier,
      correct:    item.emoji,
      options:    shuffle([item, ...wrong]).map((o) => o.emoji),
    };
  });
}

/* ─── component ─── */

type NextGame = { emoji: string; label: string; color: string };
export function PictureQuizGame({
  onBack,
  onComplete,
  category = "mixed",
  nextGame,
}: {
  onBack: () => void;
  onComplete: (result?: GameResult) => void;
  category?: string;
  nextGame?: NextGame;
}) {
  const vocab = VOCAB_BY_CATEGORY[category] ?? VOCAB_MIXED;
  const meta  = CATEGORY_META[category] ?? CATEGORY_META.mixed;

  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(vocab));
  const [index, setIndex]   = useState(0);
  const [score, setScore]   = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone]     = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const { effectKey, trigger } = useCorrectEffect();
  const announcedDone = useRef(false);

  useEffect(() => {
    if (done) return;
    const { prompt, classifier } = questions[index];
    const prefix = index === 0 ? `${meta.intro} ` : "";
    speak(`${prefix}${prompt}${classifier}ไหนนะ? ลองชี้ให้คิโด้ดูหน่อย!`, "talking");
  }, [index, done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak(`เก่งมากเลย! ${meta.doneMsg} 🏆`, "celebrating");
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setQuestions(buildQuestions(vocab));
    setIndex(0);
    setScore(0);
    setSelected(null);
    setDone(false);
    announcedDone.current = false;
  }

  const handlePick = useCallback(
    (emoji: string) => {
      if (selected !== null) return;
      setSelected(emoji);
      const word = questions[index].prompt;
      const cl   = questions[index].classifier;
      const advance = () => {
        if (index + 1 >= questions.length) setDone(true);
        else { setIndex((i) => i + 1); setSelected(null); }
      };
      if (emoji === questions[index].correct) {
        setScore((s) => s + 1);
        trigger();
        speak(`ใช่เลย! นั่นแหละ${word}${cl}นั้น เก่งมากเลย!`, "celebrating", advance);
      } else {
        speak(`ยังไม่ใช่นะ ลองหา${word}สัก${cl}อีกครั้งนะ!`, "thinking", advance);
      }
    },
    [selected, index, questions, speak, trigger]
  );

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">จบแล้ว! 🎉</h2>
        <p className="text-gray-400 text-sm mb-1">{meta.title}</p>
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
        {nextGame && (
          <button
            onClick={() => onComplete({ score, total: questions.length })}
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

  const q = questions[index];
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <CorrectEffect effectKey={effectKey} />
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="text-right">
          <p className="text-xs text-gray-400">{meta.title}</p>
          <span className="text-sm text-gray-500">ข้อ {index + 1} / {questions.length}</span>
        </div>
      </div>
      <Progress value={(index / questions.length) * 100} className="mb-8 h-2" />

      <div className="text-center mb-8">
        <p className="text-gray-400 text-sm mb-2">ชี้รูปที่ถูกต้อง</p>
        <h2 className="text-5xl font-bold text-gray-900">{q.prompt}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {q.options.map((emoji) => {
          const isSelected = selected === emoji;
          const isCorrect  = emoji === q.correct;
          let cls = "aspect-square rounded-3xl flex items-center justify-center text-7xl transition-all border-2 ";
          if (selected !== null) {
            if (isCorrect)      cls += "bg-green-100 border-green-400";
            else if (isSelected) cls += "bg-red-100 border-red-400";
            else                 cls += "bg-white border-gray-200 opacity-40";
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
