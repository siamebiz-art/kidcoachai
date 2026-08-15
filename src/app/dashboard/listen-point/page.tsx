"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { playSound } from "@/lib/sounds";

// ── Item database ─────────────────────────────────────────────────────────────
interface Item { emoji: string; th: string }

const ANIMALS: Item[] = [
  { emoji: "🐶", th: "หมา" },    { emoji: "🐱", th: "แมว" },
  { emoji: "🐸", th: "กบ" },     { emoji: "🐘", th: "ช้าง" },
  { emoji: "🐮", th: "วัว" },    { emoji: "🦁", th: "สิงโต" },
  { emoji: "🐰", th: "กระต่าย" },{ emoji: "🐷", th: "หมู" },
  { emoji: "🐔", th: "ไก่" },    { emoji: "🦆", th: "เป็ด" },
  { emoji: "🐟", th: "ปลา" },    { emoji: "🐢", th: "เต่า" },
  { emoji: "🐧", th: "เพนกวิน" },{ emoji: "🦋", th: "ผีเสื้อ" },
  { emoji: "🐝", th: "ผึ้ง" },   { emoji: "🐦", th: "นก" },
];

const FRUITS: Item[] = [
  { emoji: "🍎", th: "แอปเปิ้ล" },{ emoji: "🍌", th: "กล้วย" },
  { emoji: "🍊", th: "ส้ม" },      { emoji: "🍉", th: "แตงโม" },
  { emoji: "🍇", th: "องุ่น" },    { emoji: "🍓", th: "สตรอว์เบอร์รี่" },
  { emoji: "🥭", th: "มะม่วง" },   { emoji: "🍍", th: "สับปะรด" },
  { emoji: "🍑", th: "ลูกพีช" },   { emoji: "🍋", th: "มะนาว" },
  { emoji: "🍒", th: "เชอร์รี่" }, { emoji: "🥝", th: "กีวี" },
  { emoji: "🥥", th: "มะพร้าว" },  { emoji: "🥒", th: "แตงกวา" },
];

const COLORS: Item[] = [
  { emoji: "🔴", th: "สีแดง" },    { emoji: "🟡", th: "สีเหลือง" },
  { emoji: "🟢", th: "สีเขียว" },  { emoji: "🔵", th: "สีฟ้า" },
  { emoji: "🟣", th: "สีม่วง" },   { emoji: "🟠", th: "สีส้ม" },
  { emoji: "⚫", th: "สีดำ" },     { emoji: "⚪", th: "สีขาว" },
  { emoji: "🟤", th: "สีน้ำตาล" },{ emoji: "🩷", th: "สีชมพู" },
];

const VEHICLES: Item[] = [
  { emoji: "🚗", th: "รถ" },         { emoji: "🚌", th: "รถบัส" },
  { emoji: "✈️", th: "เครื่องบิน" }, { emoji: "🚂", th: "รถไฟ" },
  { emoji: "🚢", th: "เรือ" },        { emoji: "🚁", th: "เฮลิคอปเตอร์" },
  { emoji: "🚲", th: "จักรยาน" },    { emoji: "🚀", th: "จรวด" },
  { emoji: "⛵", th: "เรือใบ" },     { emoji: "🛺", th: "สามล้อ" },
];

const FOODS: Item[] = [
  { emoji: "🍚", th: "ข้าว" },       { emoji: "🍜", th: "ก๋วยเตี๋ยว" },
  { emoji: "🍕", th: "พิซซ่า" },     { emoji: "🍔", th: "เบอร์เกอร์" },
  { emoji: "🍦", th: "ไอศกรีม" },    { emoji: "🎂", th: "เค้ก" },
  { emoji: "🍩", th: "โดนัท" },      { emoji: "🧁", th: "คัพเค้ก" },
  { emoji: "🍫", th: "ช็อกโกแลต" }, { emoji: "🍿", th: "ป๊อปคอร์น" },
  { emoji: "🥚", th: "ไข่" },         { emoji: "🧇", th: "วาฟเฟิล" },
];

const BODY: Item[] = [
  { emoji: "👁️", th: "ตา" },         { emoji: "👃", th: "จมูก" },
  { emoji: "👄", th: "ปาก" },         { emoji: "👂", th: "หู" },
  { emoji: "🦷", th: "ฟัน" },         { emoji: "🤚", th: "มือ" },
  { emoji: "🦶", th: "เท้า" },        { emoji: "💪", th: "แขน" },
  { emoji: "🦵", th: "ขา" },          { emoji: "👆", th: "นิ้วมือ" },
  { emoji: "💅", th: "เล็บ" },        { emoji: "🧠", th: "สมอง" },
];

// ── Config ────────────────────────────────────────────────────────────────────
type Category = "animals" | "fruits" | "colors" | "vehicles" | "foods" | "body";
type Choices  = 2 | 4;
type Phase    = "setup" | "game" | "done";

const CATEGORIES: { key: Category; label: string; emoji: string; items: Item[]; color: string }[] = [
  { key: "animals",  label: "สัตว์",          emoji: "🐾", items: ANIMALS,  color: "from-green-400 to-emerald-500"  },
  { key: "fruits",   label: "ผลไม้",          emoji: "🍎", items: FRUITS,   color: "from-red-400 to-pink-500"       },
  { key: "colors",   label: "สี",             emoji: "🎨", items: COLORS,   color: "from-purple-400 to-violet-500"  },
  { key: "vehicles", label: "ยานพาหนะ",      emoji: "🚗", items: VEHICLES, color: "from-blue-400 to-cyan-500"      },
  { key: "foods",    label: "อาหาร & ขนม",   emoji: "🍕", items: FOODS,    color: "from-orange-400 to-amber-500"   },
  { key: "body",     label: "ร่างกายของฉัน",  emoji: "🫀", items: BODY,     color: "from-rose-400 to-pink-500"      },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

interface Question { correct: Item; options: Item[] }

function buildQuestions(items: Item[], numChoices: Choices, rounds: number): Question[] {
  return shuffle(items).slice(0, rounds).map(correct => {
    const distractors = shuffle(items.filter(i => i.emoji !== correct.emoji)).slice(0, numChoices - 1);
    return { correct, options: shuffle([correct, ...distractors]) };
  });
}

function speak(text: string, rate = 0.78, pitch = 1.15) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH"; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ListenPointPage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const { difficulty, diffLabel, recordResult, justPromoted, promotedToLabel, clearJustPromoted } = useGameDifficulty("listen-point");

  // map difficulty → numChoice: easy=2, medium/hard=4
  const [phase,     setPhase]    = useState<Phase>("setup");
  const [category,  setCategory] = useState<Category>("animals");
  // Pre-select choices from stored difficulty
  const [numChoice, setNumChoice]= useState<Choices>(2);
  const [questions, setQuestions]= useState<Question[]>([]);
  const [idx,       setIdx]      = useState(0);
  const [score,     setScore]    = useState(0);
  const [picked,    setPicked]   = useState<string | null>(null); // emoji
  const [animKey,   setAnimKey]  = useState(0);

  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rounds = 8;

  const cat  = CATEGORIES.find(c => c.key === category)!;
  const q    = questions[idx];

  // ── Auto-speak on new question ─────────────────────────────────────────────
  const speakQuestion = useCallback((item: Item) => {
    speak(`${item.th}อันไหนนะ`);
    // Repeat after 4s if no answer
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    repeatTimer.current = setTimeout(() => speak(item.th, 0.72, 1.2), 4500);
  }, []);

  useEffect(() => {
    if (phase === "game" && q && !picked) {
      const t = setTimeout(() => speakQuestion(q.correct), 380);
      return () => clearTimeout(t);
    }
  }, [idx, phase, q, picked, speakQuestion]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (repeatTimer.current) clearTimeout(repeatTimer.current);
    };
  }, []);

  // ── Sync numChoice จาก difficulty hook (ทำครั้งแรก) ────────────────────────
  useEffect(() => {
    setNumChoice(difficulty === "easy" ? 2 : 4);
  }, [difficulty]);

  // ── บันทึก session เมื่อเกมจบ ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "done" && questions.length > 0) {
      const accuracy = Math.round((score / questions.length) * 100);
      const { promoted } = recordResult(accuracy); // อัปเดต difficulty ใน localStorage
      if (promoted) { playSound("levelUp"); }
      else if (accuracy >= 80) { playSound("celebrate"); }
      saveGameSession({
        gameId: "listen-point",
        gameName: "ฟังแล้วชี้",
        date: new Date().toISOString().split("T")[0],
        score,
        total: questions.length,
        accuracy,
        ts: Date.now(),
      }).catch(console.error);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pick ───────────────────────────────────────────────────────────────────
  function pick(emoji: string) {
    if (picked || !q) return;
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    setPicked(emoji);

    const correct = emoji === q.correct.emoji;
    if (correct) {
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(40);
      setScore(s => s + 1);
      speak(`เก่งมากเลย! ใช่แล้ว ${q.correct.th}!`, 0.82, 1.2);
    } else {
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
      speak(`ยังไม่ใช่นะ หา ${q.correct.th} อีกทีนะ`, 0.78, 1.1);
    }

    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= questions.length) { setPhase("done"); }
      else { setIdx(i => i + 1); setAnimKey(k => k + 1); }
    }, correct ? 1400 : 1800);
  }

  function startGame() {
    const qs = buildQuestions(cat.items, numChoice, rounds);
    setQuestions(qs); setIdx(0); setScore(0); setPicked(null); setAnimKey(0);
    setPhase("game");
    speak(`มาเล่น${cat.label}กันนะ!`, 0.82, 1.2);
  }

  function reset() {
    window.speechSynthesis?.cancel();
    setPhase("setup"); setPicked(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 pb-24">
      <div className="max-w-md mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">👂 ฟังแล้วชี้</h1>
            <p className="text-sm text-gray-500">Kido พูด · แตะรูปให้ถูก ✨</p>
          </div>
        </div>

        {/* Kido speech */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-sky-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! 👋 Kido จะพูดชื่อ แล้ว{childName}แตะรูปที่ถูกต้องนะ ไม่ต้องอ่านหนังสือเลย! 🎯
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-sm font-black text-gray-700 mb-3">เลือกหมวดหมู่</p>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map(c => {
              const sel = category === c.key;
              return (
                <button key={c.key} onClick={() => { playSound("tap"); setCategory(c.key); }}
                  className={`rounded-2xl p-3.5 border-2 flex items-center gap-3 active:scale-[0.97] transition-all text-left
                    ${sel ? "border-indigo-300 bg-indigo-50" : "border-gray-100 bg-gray-50"}`}>
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <div className={`font-black text-sm ${sel ? "text-indigo-700" : "text-gray-500"}`}>{c.label}</div>
                    <div className="text-xs text-gray-400">{c.items.length} รูป</div>
                  </div>
                  {sel && <span className="ml-auto font-bold text-sm text-indigo-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">จำนวนตัวเลือก</p>
          <div className="flex gap-3">
            {([2, 4] as Choices[]).map(n => {
              const sel = numChoice === n;
              return (
                <button key={n} onClick={() => { playSound("tap"); setNumChoice(n); }}
                  className={`flex-1 rounded-2xl p-4 border-2 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all
                    ${sel ? "border-indigo-300 bg-indigo-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex gap-1">
                    {Array.from({ length: n }).map((_, i) => (
                      <span key={i} className={`text-lg rounded-lg w-8 h-8 flex items-center justify-center
                        ${sel ? "bg-indigo-100" : "bg-gray-200"}`}>🖼️</span>
                    ))}
                  </div>
                  <div className={`font-black text-sm ${sel ? "text-indigo-700" : "text-gray-500"}`}>
                    {n === 2 ? "2 รูป (ง่าย)" : "4 รูป (ท้าทาย)"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => { playSound("tap"); startGame(); }}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-sky-500 to-indigo-600 active:scale-[0.98] transition-transform">
          👂 เริ่มเลย!
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = score / questions.length;
    speak(pct >= 0.8 ? "เก่งมากเลย! ทำได้ดีมากเลย!" : pct >= 0.5 ? "ดีมากเลย! ลองอีกครั้งนะ" : "ลองฝึกอีกครั้งนะ", 0.8, 1.2);
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kido-celebrate.png" alt="Kido" className="w-36 h-36 object-contain mb-3 animate-bounce" />

        {/* 🎉 Promotion banner */}
        {justPromoted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div className="text-left">
              <div className="text-sm font-black text-yellow-800">เลื่อนระดับแล้ว!</div>
              <div className="text-xs text-yellow-600">ตอนนี้เล่นระดับ &quot;{promotedToLabel}&quot; แล้วนะ</div>
            </div>
            <button onClick={clearJustPromoted} className="ml-auto text-yellow-400 text-lg">×</button>
          </div>
        )}

        <h2 className="text-3xl font-black text-gray-900 mb-2">
          {pct >= 0.8 ? "เก่งมากเลย! 🎉" : pct >= 0.5 ? "ดีมาก! 👏" : "ลองอีกครั้งนะ 💪"}
        </h2>
        <p className="text-sm text-gray-400 mb-3">ระดับ: {diffLabel}</p>
        <div className="flex items-center gap-3 mb-5">
          {questions.map((_, i) => (
            <span key={i} className={`w-4 h-4 rounded-full ${i < score ? "bg-green-400" : "bg-gray-200"}`} />
          ))}
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={startGame}
            className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95">
            <RefreshCcw className="w-4 h-4" /> เล่นใหม่
          </button>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm active:scale-95">
              กลับหน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GAME
  // ─────────────────────────────────────────────────────────────────────────
  if (!q) return null;

  const gridCols = numChoice === 2 ? "grid-cols-2" : "grid-cols-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex flex-col select-none">
      <style>{`
        @keyframes card-pop {
          0%  { transform: scale(.7) rotate(-5deg); opacity:0 }
          70% { transform: scale(1.06) rotate(2deg); opacity:1 }
          100%{ transform: scale(1) rotate(0); opacity:1 }
        }
        @keyframes correct-burst {
          0%  { transform: scale(1); box-shadow: 0 0 0 0 rgba(52,211,153,.7) }
          60% { transform: scale(1.08); box-shadow: 0 0 0 20px rgba(52,211,153,0) }
          100%{ transform: scale(1.04); box-shadow: none }
        }
        @keyframes wrong-shake {
          0%,100%{ transform: translateX(0) }
          20%    { transform: translateX(-10px) }
          40%    { transform: translateX(10px) }
          60%    { transform: translateX(-7px) }
          80%    { transform: translateX(7px) }
        }
        .card-pop     { animation: card-pop .4s cubic-bezier(.34,1.56,.64,1) both }
        .correct-burst{ animation: correct-burst .5s ease forwards }
        .wrong-shake  { animation: wrong-shake .45s ease }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={reset}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-90">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        {/* Progress dots */}
        <div className="flex gap-1.5 items-center">
          {questions.map((_, i) => (
            <span key={i} className={`rounded-full transition-all duration-300
              ${i < idx ? "w-3 h-3 bg-green-400"
              : i === idx ? "w-4 h-4 bg-indigo-500 scale-110"
              : "w-3 h-3 bg-gray-200"}`} />
          ))}
        </div>
        {/* Kido mini */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kido-point.png" alt="" className="w-10 h-10 object-contain" />
      </div>

      {/* Kido prompt — just the emoji/face, no text */}
      <div className="flex justify-center px-4 pt-2 pb-1 shrink-0">
        <button onClick={() => { playSound("tap"); speak(`${q.correct.th}อันไหนนะ`, 0.78, 1.2); }}
          className="bg-white rounded-2xl border border-indigo-100 shadow-sm px-5 py-3 flex items-center gap-2 active:scale-95 transition-transform">
          <span className="text-xl">🔊</span>
          <span className="text-indigo-600 font-black text-sm">ฟังอีกครั้ง</span>
        </button>
      </div>

      {/* Options grid */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4">
        <div key={animKey} className={`grid ${gridCols} gap-4 w-full max-w-sm`}>
          {q.options.map((opt, i) => {
            const isCorrect  = opt.emoji === q.correct.emoji;
            const isSelected = picked === opt.emoji;
            const revealed   = picked !== null;

            let cardClass = "aspect-square rounded-3xl border-3 flex items-center justify-center transition-all duration-200 ";
            let anim = i < 2 ? "card-pop" : "card-pop";
            anim = ""; // use key-based

            if (!revealed) {
              cardClass += "bg-white border-gray-200 shadow-md active:scale-95 cursor-pointer hover:border-indigo-300 hover:shadow-lg";
            } else if (isCorrect) {
              cardClass += "bg-emerald-100 border-emerald-400 shadow-lg correct-burst";
            } else if (isSelected) {
              cardClass += "bg-red-100 border-red-400 wrong-shake";
            } else {
              cardClass += "bg-gray-100 border-gray-200 opacity-40";
            }

            return (
              <button
                key={`${animKey}-${opt.emoji}`}
                onClick={() => pick(opt.emoji)}
                disabled={picked !== null}
                className={`${cardClass} card-pop`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span style={{ fontSize: numChoice === 2 ? "5.5rem" : "4rem", lineHeight: 1 }}>
                  {opt.emoji}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer hint — icon only, no text */}
      <div className="pb-6 flex justify-center shrink-0">
        <span className="text-2xl opacity-40 animate-bounce">👆</span>
      </div>
    </div>
  );
}
