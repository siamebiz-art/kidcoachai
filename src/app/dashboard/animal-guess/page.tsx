"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { playSound } from "@/lib/sounds";

// ── Animal database ───────────────────────────────────────────────────────────

interface Animal { emoji: string; thai: string; level: "easy" | "medium" | "hard" }

const ANIMALS: Animal[] = [
  // easy – 16 สัตว์ทั่วไป
  { emoji: "🐶", thai: "สุนัข",        level: "easy"   },
  { emoji: "🐱", thai: "แมว",         level: "easy"   },
  { emoji: "🐭", thai: "หนู",          level: "easy"   },
  { emoji: "🐰", thai: "กระต่าย",     level: "easy"   },
  { emoji: "🐸", thai: "กบ",           level: "easy"   },
  { emoji: "🐔", thai: "ไก่",          level: "easy"   },
  { emoji: "🐧", thai: "เพนกวิน",     level: "easy"   },
  { emoji: "🦆", thai: "เป็ด",         level: "easy"   },
  { emoji: "🐴", thai: "ม้า",          level: "easy"   },
  { emoji: "🐮", thai: "วัว",          level: "easy"   },
  { emoji: "🐷", thai: "หมู",          level: "easy"   },
  { emoji: "🐑", thai: "แกะ",          level: "easy"   },
  { emoji: "🐵", thai: "ลิง",          level: "easy"   },
  { emoji: "🐘", thai: "ช้าง",         level: "easy"   },
  { emoji: "🦁", thai: "สิงโต",       level: "easy"   },
  { emoji: "🐯", thai: "เสือ",         level: "easy"   },
  // medium – 14 สัตว์
  { emoji: "🐻", thai: "หมี",          level: "medium" },
  { emoji: "🐼", thai: "แพนด้า",      level: "medium" },
  { emoji: "🦊", thai: "จิ้งจอก",     level: "medium" },
  { emoji: "🐺", thai: "หมาป่า",      level: "medium" },
  { emoji: "🦒", thai: "ยีราฟ",       level: "medium" },
  { emoji: "🦓", thai: "ม้าลาย",      level: "medium" },
  { emoji: "🦏", thai: "แรด",          level: "medium" },
  { emoji: "🐊", thai: "จระเข้",      level: "medium" },
  { emoji: "🐬", thai: "โลมา",         level: "medium" },
  { emoji: "🦈", thai: "ฉลาม",         level: "medium" },
  { emoji: "🐢", thai: "เต่า",         level: "medium" },
  { emoji: "🐍", thai: "งู",           level: "medium" },
  { emoji: "🦋", thai: "ผีเสื้อ",     level: "medium" },
  { emoji: "🦜", thai: "นกแก้ว",      level: "medium" },
  // hard – 12 สัตว์หายาก
  { emoji: "🦘", thai: "จิงโจ้",      level: "hard"   },
  { emoji: "🐨", thai: "โคอาล่า",     level: "hard"   },
  { emoji: "🦦", thai: "นากน้ำ",      level: "hard"   },
  { emoji: "🦥", thai: "สลอธ",        level: "hard"   },
  { emoji: "🦩", thai: "นกฟลามิงโก้", level: "hard"  },
  { emoji: "🦚", thai: "นกยูง",       level: "hard"   },
  { emoji: "🦉", thai: "นกฮูก",       level: "hard"   },
  { emoji: "🦅", thai: "นกอินทรี",    level: "hard"   },
  { emoji: "🦇", thai: "ค้างคาว",     level: "hard"   },
  { emoji: "🐙", thai: "ปลาหมึก",     level: "hard"   },
  { emoji: "🦞", thai: "กุ้งมังกร",   level: "hard"   },
  { emoji: "🦑", thai: "หมึก",         level: "hard"   },
];

// ── Config ────────────────────────────────────────────────────────────────────

type Level = "easy" | "medium" | "hard";
type Phase = "setup" | "game" | "done";

const CFG: Record<Level, { label: string; icon: string; rounds: number; choices: number; include: Level[] }> = {
  easy:   { label: "ง่าย",    icon: "🌟", rounds: 8,  choices: 3, include: ["easy"]                     },
  medium: { label: "ปานกลาง", icon: "🔥", rounds: 10, choices: 4, include: ["easy", "medium"]            },
  hard:   { label: "ยาก",    icon: "💪", rounds: 12, choices: 4, include: ["easy", "medium", "hard"]    },
};

// Pastel palette per choice slot
const SLOT_STYLE = [
  "bg-sky-100     border-sky-200     text-sky-800",
  "bg-emerald-100 border-emerald-200 text-emerald-800",
  "bg-amber-100   border-amber-200   text-amber-800",
  "bg-rose-100    border-rose-200    text-rose-800",
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

interface Question { animal: Animal; choices: Animal[] }

function buildRound(level: Level): Question[] {
  const cfg = CFG[level];
  const pool = ANIMALS.filter(a => cfg.include.includes(a.level));
  return shuffle(pool).slice(0, cfg.rounds).map(animal => {
    const distractors = shuffle(ANIMALS.filter(a => a.emoji !== animal.emoji)).slice(0, cfg.choices - 1);
    return { animal, choices: shuffle([animal, ...distractors]) };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnimalGuessPage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const { difficulty, diffLabel, recordResult, justPromoted, promotedToLabel, clearJustPromoted } = useGameDifficulty("animal-guess");
  // map difficulty → level: easy→easy, medium→medium, hard→hard (ตรงกันพอดี)
  const diffToLevel: Record<string, Level> = { easy: "easy", medium: "medium", hard: "hard" };

  const [phase,      setPhase]      = useState<Phase>("setup");
  const [level,      setLevel]      = useState<Level>("easy");
  const [qs,         setQs]         = useState<Question[]>([]);
  const [idx,        setIdx]        = useState(0);
  const [score,      setScore]      = useState(0);
  const [correctCount, setCorrectCount] = useState(0); // track จำนวนถูกจริงๆ (ไม่รวม streak bonus)
  const [streak,     setStreak]     = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [chosen,     setChosen]     = useState<string | null>(null);
  const [animKey,    setAnimKey]    = useState(0);

  // Sync level จาก difficulty hook
  useEffect(() => {
    setLevel(diffToLevel[difficulty] ?? "easy");
  }, [difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  // บันทึก session เมื่อเกมจบ
  useEffect(() => {
    if (phase === "done" && qs.length > 0) {
      const accuracy = Math.round((correctCount / qs.length) * 100);
      const { promoted } = recordResult(accuracy);
      if (promoted) { playSound("levelUp"); }
      else if (accuracy >= 80) { playSound("celebrate"); }
      saveGameSession({
        gameId: "animal-guess",
        gameName: "ทายรูปสัตว์",
        date: new Date().toISOString().split("T")[0],
        score: correctCount,
        total: qs.length,
        accuracy,
        ts: Date.now(),
      }).catch(console.error);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = CFG[level];
  const q   = qs[idx];

  // ── Actions ──────────────────────────────────────────────────────────────

  function startGame() {
    setQs(buildRound(level));
    setIdx(0); setScore(0); setCorrectCount(0); setStreak(0); setBestStreak(0);
    setChosen(null); setAnimKey(k => k + 1); setPhase("game");
  }

  function pick(animal: Animal) {
    if (chosen || !q) return;
    setChosen(animal.emoji);
    const correct = animal.emoji === q.animal.emoji;

    if (correct) {
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(40);
      setScore(s => s + (streak >= 2 ? 2 : 1));
      setCorrectCount(c => c + 1); // track ถูก/ผิดจริงๆ
      setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
    } else {
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([70, 30, 70]);
      setStreak(0);
    }

    setTimeout(() => {
      setChosen(null);
      if (idx + 1 >= qs.length) { setPhase("done"); }
      else { setIdx(i => i + 1); setAnimKey(k => k + 1); }
    }, 1150);
  }

  function reset() {
    setPhase("setup"); setQs([]); setIdx(0);
    setScore(0); setCorrectCount(0); setStreak(0); setBestStreak(0); setChosen(null);
  }

  // ── Choice styling ────────────────────────────────────────────────────────

  function choiceClass(opt: Animal, slotIdx: number): string {
    if (!chosen) return `border-2 ${SLOT_STYLE[slotIdx]} active:brightness-95 transition-all`;
    if (opt.emoji === q.animal.emoji) return "border-2 bg-emerald-500 border-emerald-600 text-white";
    if (opt.emoji === chosen)         return "border-2 bg-red-400    border-red-500    text-white";
    return "border-2 bg-gray-100 border-gray-200 text-gray-400 opacity-50";
  }

  function choiceLabel(opt: Animal): string {
    if (!chosen)                      return opt.thai;
    if (opt.emoji === q.animal.emoji) return `✅  ${opt.thai}`;
    if (opt.emoji === chosen)         return `❌  ${opt.thai}`;
    return opt.thai;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SETUP
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 pb-24">
      <div className="max-w-md mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🐾 ทายรูปสัตว์</h1>
            <p className="text-sm text-gray-500">ฝึกจำชื่อสัตว์ภาษาไทย ✨</p>
          </div>
        </div>

        {/* Kido intro */}
        <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-amber-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! 🐾 มาทายชื่อสัตว์กันเถอะ ดูรูปแล้วเลือกชื่อที่ถูกต้องนะ
            </p>
            <p className="text-gray-400 text-xs mt-1">มีสัตว์ 40+ ชนิดให้ทาย 🎯</p>
          </div>
        </div>

        {/* Level selector */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">ระดับความยาก</p>
          <div className="flex flex-col gap-2.5">
            {(["easy", "medium", "hard"] as Level[]).map(lv => {
              const c   = CFG[lv];
              const sel = level === lv;
              const border = sel ? { easy: "border-green-300 bg-green-50", medium: "border-yellow-300 bg-yellow-50", hard: "border-red-300 bg-red-50" }[lv] : "border-gray-100 bg-gray-50";
              const txt   = sel ? { easy: "text-green-700",               medium: "text-yellow-700",               hard: "text-red-700"               }[lv] : "text-gray-500";
              return (
                <button key={lv} onClick={() => { playSound("tap"); setLevel(lv); }}
                  className={`rounded-2xl p-4 border-2 flex items-center gap-4 active:scale-[0.97] transition-all ${border}`}>
                  <span className="text-2xl">{c.icon}</span>
                  <div className="text-left flex-1">
                    <div className={`font-black text-sm ${txt}`}>{c.label}</div>
                    <div className="text-xs text-gray-400">{c.rounds} ข้อ · {c.choices} ตัวเลือก</div>
                  </div>
                  {sel && <span className={`font-bold text-sm ${txt}`}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => { playSound("tap"); startGame(); }}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-orange-400 to-amber-500 active:scale-[0.98] transition-transform">
          🐾 เริ่มเลย!
        </button>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = correctCount / qs.length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kido-celebrate.png" alt="Kido" className="w-32 h-32 object-contain mb-3 animate-bounce" />

        {/* 🎉 Promotion banner */}
        {justPromoted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2 w-full max-w-xs">
            <span className="text-xl">🏆</span>
            <div className="text-left">
              <div className="text-sm font-black text-yellow-800">เลื่อนระดับแล้ว!</div>
              <div className="text-xs text-yellow-600">ตอนนี้เล่นระดับ &quot;{promotedToLabel}&quot; แล้วนะ</div>
            </div>
            <button onClick={clearJustPromoted} className="ml-auto text-yellow-400 text-lg leading-none">×</button>
          </div>
        )}

        <h2 className="text-3xl font-black text-gray-900 mb-2">
          {pct >= 0.8 ? "เก่งมากเลย! 🎉" : pct >= 0.5 ? "ทำได้ดี! 👏" : "ลองอีกครั้งนะ 💪"}
        </h2>
        <p className="text-sm text-gray-400 mb-1">ระดับ: {diffLabel}</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black text-orange-500">{correctCount}</span>
          <span className="text-xl text-gray-400">/ {qs.length}</span>
        </div>
        <p className="text-gray-400 text-sm mb-2">ถูก</p>
        {bestStreak >= 3 && (
          <p className="text-orange-500 font-bold text-sm mb-4">🔥 สตรีคสูงสุด {bestStreak} ข้อ!</p>
        )}
        <div className="flex gap-3 w-full max-w-xs mt-4">
          <button onClick={startGame}
            className="flex-1 py-3.5 rounded-2xl bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <RefreshCcw className="w-4 h-4" /> เล่นใหม่
          </button>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm active:scale-95 transition-transform">
              กลับหน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GAME
  // ──────────────────────────────────────────────────────────────────────────
  if (!q) return null;

  const progress  = ((idx + (chosen ? 1 : 0)) / qs.length) * 100;
  const gridCols  = cfg.choices === 3 ? "grid-cols-1" : "grid-cols-2";
  const bonusMode = streak >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col">
      <style>{`
        @keyframes animal-pop {
          0%   { transform: scale(0.35) rotate(-8deg); opacity: 0 }
          65%  { transform: scale(1.1)  rotate(3deg);  opacity: 1 }
          100% { transform: scale(1)    rotate(0deg);  opacity: 1 }
        }
        .animal-pop { animation: animal-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) both }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={reset}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <div className="font-black text-sm text-gray-800">🐾 ทายรูปสัตว์ · {cfg.label}</div>
          <div className="text-xs text-gray-400">ข้อ {idx + 1} / {qs.length}</div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${bonusMode ? "bg-orange-100" : "bg-amber-50"}`}>
          {bonusMode && <span className="text-sm">🔥</span>}
          <span className="font-black text-amber-600 text-sm">⭐ {score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4 shrink-0">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5 py-2">

        {/* Animal card — re-animates on new question via key */}
        <div key={animKey} className="animal-pop">
          <div className="w-44 h-44 bg-white rounded-3xl shadow-md border-2 border-amber-100 flex items-center justify-center">
            <span style={{ fontSize: "7.5rem", lineHeight: 1 }}>{q.animal.emoji}</span>
          </div>
        </div>

        {/* Streak bonus badge */}
        {bonusMode && (
          <div className="bg-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-sm">
            🔥 {streak} ข้อติดต่อกัน! · +2 คะแนน
          </div>
        )}

        {/* Choices */}
        <div className={`w-full max-w-sm grid ${gridCols} gap-3`}>
          {q.choices.map((opt, i) => (
            <button
              key={opt.emoji}
              onClick={() => pick(opt)}
              disabled={chosen !== null}
              className={`py-4 px-4 rounded-2xl font-black text-base ${choiceClass(opt, i)}`}
            >
              {choiceLabel(opt)}
            </button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 pb-8 pt-2 shrink-0 text-center">
        <p className="text-xs text-gray-400">
          {!chosen
            ? "เลือกชื่อสัตว์ที่ถูกต้อง"
            : chosen === q.animal.emoji
              ? "🎉 ถูกต้อง! ไปข้อต่อไป..."
              : `คำตอบที่ถูกคือ "${q.animal.thai}"`}
        </p>
      </div>
    </div>
  );
}
