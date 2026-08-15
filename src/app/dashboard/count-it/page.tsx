"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { playSound } from "@/lib/sounds";

// ── ชุด emoji สำหรับนับ ────────────────────────────────────────────────────────
const EMOJI_SETS = ["⭐", "🍎", "🐟", "🦋", "🌸", "🎈", "🍪", "🐥", "🌕", "🚗"];

type Difficulty = "easy" | "medium" | "hard";
type Phase = "setup" | "game" | "done";

interface Question {
  count:   number;
  emoji:   string;
  choices: number[];
}

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildQs(diff: Difficulty, rounds: number): Question[] {
  const maxCount = diff === "easy" ? 5 : diff === "medium" ? 10 : 15;
  const numChoices = diff === "easy" ? 3 : 4;
  return Array.from({ length: rounds }, (_, i) => {
    const count = Math.floor(Math.random() * maxCount) + 1;
    const emoji = EMOJI_SETS[i % EMOJI_SETS.length];
    // สร้างตัวเลือก: ถูก + ผิด ไม่ซ้ำ
    const wrongs = new Set<number>();
    while (wrongs.size < numChoices - 1) {
      const w = Math.floor(Math.random() * maxCount) + 1;
      if (w !== count) wrongs.add(w);
    }
    const choices = shuffle([count, ...wrongs]);
    return { count, emoji, choices };
  });
}

function speak(text: string, rate = 0.78, pitch = 1.15) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH"; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

const ROUNDS = 8;

export default function CountItPage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const { difficulty, diffLabel, recordResult, justPromoted, promotedToLabel, clearJustPromoted } = useGameDifficulty("count-it");

  const [phase,    setPhase]  = useState<Phase>("setup");
  const [diff,     setDiff]   = useState<Difficulty>("easy");
  const [questions,setQs]     = useState<Question[]>([]);
  const [idx,      setIdx]    = useState(0);
  const [score,    setScore]  = useState(0);
  const [picked,   setPicked] = useState<number | null>(null);
  const [animKey,  setAnimKey]= useState(0);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = questions[idx];

  // sync diff จาก hook
  useEffect(() => { setDiff(difficulty as Difficulty); }, [difficulty]);

  const speakQ = useCallback(() => {
    speak("มีกี่อันนะ?", 0.78, 1.2);
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    repeatTimer.current = setTimeout(() => speak("นับดูนะ... มีกี่อัน?", 0.72, 1.15), 5000);
  }, []);

  useEffect(() => {
    if (phase === "game" && q && picked === null) {
      const t = setTimeout(speakQ, 400);
      return () => clearTimeout(t);
    }
  }, [idx, phase, q, picked, speakQ]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
  }, []);

  useEffect(() => {
    if (phase !== "done" || !questions.length) return;
    const accuracy = Math.round((score / questions.length) * 100);
    const { promoted } = recordResult(accuracy);
    if (promoted) playSound("levelUp");
    else if (accuracy >= 80) playSound("celebrate");
    saveGameSession({
      gameId: "count-it", gameName: "นับจำนวน",
      date: new Date().toISOString().split("T")[0],
      score, total: questions.length, accuracy, ts: Date.now(),
    }).catch(console.error);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(n: number) {
    if (picked !== null || !q) return;
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    setPicked(n);
    const correct = n === q.count;
    if (correct) {
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(40);
      setScore(s => s + 1);
      speak(`${q.count} อัน ถูกต้องเลย!`, 0.85, 1.25);
    } else {
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
      speak(`มี ${q.count} อัน นะ ลองใหม่นะ`, 0.8, 1.1);
    }
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= questions.length) setPhase("done");
      else { setIdx(i => i + 1); setAnimKey(k => k + 1); }
    }, correct ? 1400 : 2000);
  }

  function startGame() {
    const qs = buildQs(diff, ROUNDS);
    setQs(qs); setIdx(0); setScore(0); setPicked(null); setAnimKey(0);
    setPhase("game");
    playSound("tap");
    speak("มานับเลขกันเลย!", 0.82, 1.2);
  }

  function reset() { window.speechSynthesis?.cancel(); setPhase("setup"); setPicked(null); }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🔢 นับจำนวน</h1>
            <p className="text-sm text-gray-500">นับของ แล้วแตะตัวเลขที่ถูก ✨</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0"/>
          <div className="bg-amber-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! Kido จะแสดงของ แล้วนับดูนะว่ามีกี่อัน! 🎉
            </p>
            <p className="text-gray-400 text-xs mt-1">นับ 1-5 (ง่าย) · 1-10 (กลาง) · 1-15 (ยาก)</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">ระดับความยาก</p>
          <div className="flex gap-2.5">
            {(["easy", "medium", "hard"] as Difficulty[]).map(d => {
              const sel = diff === d;
              const info: Record<Difficulty, { label: string; range: string }> = {
                easy:   { label: "ง่าย",  range: "1-5"  },
                medium: { label: "กลาง",  range: "1-10" },
                hard:   { label: "ยาก",   range: "1-15" },
              };
              return (
                <button key={d} onClick={() => { playSound("tap"); setDiff(d); }}
                  className={`flex-1 rounded-2xl py-4 border-2 flex flex-col items-center gap-1 active:scale-[0.97] transition-all
                    ${sel ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                  <span className={`font-black text-base ${sel ? "text-amber-700" : "text-gray-500"}`}>{info[d].label}</span>
                  <span className={`text-xs ${sel ? "text-amber-500" : "text-gray-400"}`}>{info[d].range}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => { playSound("tap"); startGame(); }}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 active:scale-[0.98] transition-transform">
          🔢 เริ่มนับเลย!
        </button>
      </div>
    </div>
  );

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = score / questions.length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kido-celebrate.png" alt="Kido" className="w-32 h-32 object-contain mb-3 animate-bounce"/>
        {justPromoted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2 w-full max-w-xs">
            <span className="text-xl">🏆</span>
            <div className="text-left">
              <div className="text-sm font-black text-yellow-800">เลื่อนระดับแล้ว!</div>
              <div className="text-xs text-yellow-600">ระดับ &quot;{promotedToLabel}&quot;</div>
            </div>
            <button onClick={clearJustPromoted} className="ml-auto text-yellow-400 text-lg">×</button>
          </div>
        )}
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          {pct >= 0.8 ? "นับเก่งมากเลย! 🎉" : pct >= 0.5 ? "ดีมาก! 👏" : "ลองอีกครั้งนะ 💪"}
        </h2>
        <p className="text-sm text-gray-400 mb-1">ระดับ: {diffLabel}</p>
        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-5xl font-black text-amber-600">{score}</span>
          <span className="text-xl text-gray-400">/ {questions.length}</span>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={startGame}
            className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95">
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

  // ── GAME ──────────────────────────────────────────────────────────────────
  if (!q) return null;

  // จัดเรียง emoji เป็นกลุ่ม 5
  const emojiRows: string[][] = [];
  const emojis = Array.from({ length: q.count }, () => q.emoji);
  for (let i = 0; i < emojis.length; i += 5) {
    emojiRows.push(emojis.slice(i, i + 5));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col select-none">
      <style>{`
        @keyframes emoji-pop  { 0%{transform:scale(0) rotate(-10deg);opacity:0} 70%{transform:scale(1.12);} 100%{transform:scale(1);opacity:1} }
        @keyframes num-pop    { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.08);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes correct-glow { 0%{box-shadow:0 0 0 0 rgba(245,158,11,.7)} 60%{box-shadow:0 0 0 22px rgba(245,158,11,0)} 100%{box-shadow:none} }
        @keyframes wrong-shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-7px)} 80%{transform:translateX(7px)} }
        .emoji-pop    { animation: emoji-pop .35s cubic-bezier(.34,1.56,.64,1) both }
        .num-pop      { animation: num-pop .4s cubic-bezier(.34,1.56,.64,1) both }
        .correct-glow { animation: correct-glow .5s ease forwards }
        .wrong-shake  { animation: wrong-shake .45s ease }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={reset}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-90">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex gap-1.5 items-center">
          {questions.map((_, i) => (
            <span key={i} className={`rounded-full transition-all
              ${i < idx ? "w-3 h-3 bg-amber-400" : i === idx ? "w-4 h-4 bg-amber-600" : "w-3 h-3 bg-gray-200"}`} />
          ))}
        </div>
        <button onClick={() => { playSound("tap"); speak("มีกี่อันนะ?", 0.8, 1.2); }}
          className="w-9 h-9 rounded-full bg-white border border-amber-100 shadow-sm flex items-center justify-center active:scale-90">
          <span className="text-lg">🔊</span>
        </button>
      </div>

      {/* Emoji display area */}
      <div key={`emoji-${animKey}`} className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-2">
        <div className="bg-white rounded-3xl border-2 border-amber-100 shadow-sm p-6 w-full max-w-sm min-h-[200px] flex flex-col items-center justify-center gap-2">
          {emojiRows.map((row, ri) => (
            <div key={ri} className="flex gap-2 justify-center flex-wrap">
              {row.map((e, ei) => (
                <span key={ri * 5 + ei} className="emoji-pop"
                  style={{ fontSize: q.count <= 5 ? "3rem" : q.count <= 10 ? "2.2rem" : "1.7rem",
                    animationDelay: `${(ri * 5 + ei) * 0.05}s` }}>
                  {e}
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="text-gray-400 font-bold text-sm">มีกี่อัน?</p>

        {/* Number choices */}
        <div key={`nums-${animKey}`} className={`grid grid-cols-4 gap-3 w-full max-w-sm`}
          style={{ gridTemplateColumns: `repeat(${q.choices.length}, 1fr)` }}>
          {q.choices.map((n, i) => {
            const isCorrect  = n === q.count;
            const isSelected = picked === n;
            const revealed   = picked !== null;
            const COLORS = ["bg-sky-100 border-sky-200","bg-emerald-100 border-emerald-200","bg-rose-100 border-rose-200","bg-violet-100 border-violet-200"];
            let cls = "aspect-square rounded-2xl border-2 flex items-center justify-center transition-all num-pop ";
            if (!revealed)        cls += `${COLORS[i % COLORS.length]} active:scale-90 cursor-pointer shadow-sm`;
            else if (isCorrect)   cls += "bg-emerald-100 border-emerald-400 shadow-lg correct-glow";
            else if (isSelected)  cls += "bg-red-100 border-red-300 wrong-shake";
            else                  cls += "bg-gray-100 border-gray-200 opacity-40";
            return (
              <button key={`${animKey}-${n}-${i}`} onClick={() => pick(n)}
                disabled={picked !== null} className={cls}
                style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="font-black text-3xl text-gray-800">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-4 flex justify-center shrink-0">
        <span className="text-2xl opacity-40 animate-bounce">👆</span>
      </div>
    </div>
  );
}
