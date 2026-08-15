"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { useGameExitTracker } from "@/hooks/use-game-exit-tracker";
import { playSound } from "@/lib/sounds";

// ── ข้อมูลตัวอักษร A-Z ────────────────────────────────────────────────────────
interface EngLetter { letter: string; word: string; tts: string }

const ENG_LETTERS: EngLetter[] = [
  { letter: "A", word: "Apple",      tts: "A" },
  { letter: "B", word: "Ball",       tts: "B" },
  { letter: "C", word: "Cat",        tts: "C" },
  { letter: "D", word: "Dog",        tts: "D" },
  { letter: "E", word: "Egg",        tts: "E" },
  { letter: "F", word: "Fish",       tts: "F" },
  { letter: "G", word: "Goat",       tts: "G" },
  { letter: "H", word: "Hat",        tts: "H" },
  { letter: "I", word: "Ice cream",  tts: "I" },
  { letter: "J", word: "Juice",      tts: "J" },
  { letter: "K", word: "Kite",       tts: "K" },
  { letter: "L", word: "Lion",       tts: "L" },
  { letter: "M", word: "Mango",      tts: "M" },
  { letter: "N", word: "Nest",       tts: "N" },
  { letter: "O", word: "Orange",     tts: "O" },
  { letter: "P", word: "Pen",        tts: "P" },
  { letter: "Q", word: "Queen",      tts: "Q" },
  { letter: "R", word: "Rabbit",     tts: "R" },
  { letter: "S", word: "Star",       tts: "S" },
  { letter: "T", word: "Tiger",      tts: "T" },
  { letter: "U", word: "Umbrella",   tts: "U" },
  { letter: "V", word: "Van",        tts: "V" },
  { letter: "W", word: "Whale",      tts: "W" },
  { letter: "X", word: "X-ray",      tts: "X" },
  { letter: "Y", word: "Yarn",       tts: "Y" },
  { letter: "Z", word: "Zebra",      tts: "Z" },
];

const SLOT_BG = [
  "bg-sky-100 border-sky-200",
  "bg-emerald-100 border-emerald-200",
  "bg-amber-100 border-amber-200",
  "bg-rose-100 border-rose-200",
];

type Choices = 2 | 3 | 4;
type Phase   = "setup" | "game" | "done";
interface Question { correct: EngLetter; options: EngLetter[] }

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildQs(numChoices: Choices, rounds: number): Question[] {
  return shuffle(ENG_LETTERS).slice(0, rounds).map(correct => {
    const distractors = shuffle(ENG_LETTERS.filter(l => l.letter !== correct.letter)).slice(0, numChoices - 1);
    return { correct, options: shuffle([correct, ...distractors]) };
  });
}

// พูด eng ด้วย en-US
function speakEn(text: string, rate = 0.75, pitch = 1.1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

function speakTh(text: string, rate = 0.82, pitch = 1.2) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH"; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

function speakQuestion(letter: EngLetter) {
  speakEn(letter.tts);
}

function speakPraise(letter: EngLetter, correct: boolean) {
  if (correct) {
    speakTh(`เก่งมากเลย!`, 0.9, 1.25);
  } else {
    speakTh(`ลองดูอีกนะ`, 0.8, 1.1);
    setTimeout(() => speakEn(letter.tts, 0.7, 1.1), 700);
  }
}

const ROUNDS = 8;

export default function EngAlphaPage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const { difficulty, diffLabel, recordResult, justPromoted, promotedToLabel, clearJustPromoted } = useGameDifficulty("eng-alpha");
  const { markRoundStarted } = useGameExitTracker("eng-alpha", phase);

  const [phase,     setPhase]    = useState<Phase>("setup");
  const [numChoice, setNumChoice]= useState<Choices>(2);
  const [questions, setQs]       = useState<Question[]>([]);
  const [idx,       setIdx]      = useState(0);
  const [score,     setScore]    = useState(0);
  const [picked,    setPicked]   = useState<string | null>(null);
  const [animKey,   setAnimKey]  = useState(0);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = questions[idx];

  useEffect(() => {
    setNumChoice(difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4);
  }, [difficulty]);

  const speakQ = useCallback((letter: EngLetter) => {
    speakQuestion(letter);
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    repeatTimer.current = setTimeout(() => speakEn(letter.tts, 0.65, 1.1), 4500);
  }, []);

  useEffect(() => {
    if (phase === "game" && q && !picked) {
      const t = setTimeout(() => speakQ(q.correct), 400);
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
      gameId: "eng-alpha", gameName: "ทาย A B C",
      date: new Date().toISOString().split("T")[0],
      score, total: questions.length, accuracy, ts: Date.now(),
    }).catch(console.error);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(letter: string) {
    if (picked || !q) return;
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    setPicked(letter);
    const correct = letter === q.correct.letter;
    if (correct) {
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(40);
      setScore(s => s + 1);
    } else {
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    }
    speakPraise(q.correct, correct);
    setTimeout(() => {
      setPicked(null);
      if (idx + 1 >= questions.length) setPhase("done");
      else { setIdx(i => i + 1); setAnimKey(k => k + 1); }
    }, correct ? 1400 : 1900);
  }

  function startGame() {
    const qs = buildQs(numChoice, ROUNDS);
    setQs(qs); setIdx(0); setScore(0); setPicked(null); setAnimKey(0);
    setPhase("game");
    markRoundStarted();
    playSound("tap");
    speakTh("มาทาย A B C กันเลย!", 0.82, 1.2);
  }

  function reset() { window.speechSynthesis?.cancel(); setPhase("setup"); setPicked(null); }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🔤 ทาย A B C</h1>
            <p className="text-sm text-gray-500">Kido พูด · แตะตัวอักษรที่ถูก ✨</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0"/>
          <div className="bg-sky-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! Kido จะพูดตัวอักษรภาษาอังกฤษ แล้วแตะตัวที่ถูกนะ! 🎉
            </p>
            <p className="text-gray-400 text-xs mt-1">26 ตัวอักษร A-Z · ฝึกได้ตั้งแต่ 3 ขวบ!</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">จำนวนตัวเลือก</p>
          <div className="flex gap-2.5">
            {([2, 3, 4] as Choices[]).map(n => {
              const sel = numChoice === n;
              const labels: Record<number, string> = { 2: "ง่าย", 3: "กลาง", 4: "ยาก" };
              return (
                <button key={n} onClick={() => { playSound("tap"); setNumChoice(n); }}
                  className={`flex-1 rounded-2xl py-4 border-2 flex flex-col items-center gap-1 active:scale-[0.97] transition-all
                    ${sel ? "border-sky-300 bg-sky-50" : "border-gray-100 bg-gray-50"}`}>
                  <span className={`font-black text-2xl ${sel ? "text-sky-700" : "text-gray-500"}`}>{n}</span>
                  <span className={`text-xs ${sel ? "text-sky-600" : "text-gray-400"}`}>{labels[n]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => { playSound("tap"); startGame(); }}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-sky-500 to-blue-600 active:scale-[0.98] transition-transform">
          🔤 A B C เริ่มเลย!
        </button>
      </div>
    </div>
  );

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = score / questions.length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col items-center justify-center p-6 text-center">
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
          {pct >= 0.8 ? "Excellent! 🎉" : pct >= 0.5 ? "Good job! 👏" : "ลองอีกทีนะ 💪"}
        </h2>
        <p className="text-sm text-gray-400 mb-1">ระดับ: {diffLabel}</p>
        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-5xl font-black text-sky-600">{score}</span>
          <span className="text-xl text-gray-400">/ {questions.length}</span>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={startGame}
            className="flex-1 py-3.5 rounded-2xl bg-sky-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col select-none">
      <style>{`
        @keyframes card-pop { 0%{transform:scale(.65) rotate(-4deg);opacity:0} 70%{transform:scale(1.07);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes correct-glow { 0%{box-shadow:0 0 0 0 rgba(14,165,233,.7)} 60%{box-shadow:0 0 0 22px rgba(14,165,233,0)} 100%{box-shadow:none} }
        @keyframes wrong-shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-7px)} 80%{transform:translateX(7px)} }
        .card-pop      { animation: card-pop .4s cubic-bezier(.34,1.56,.64,1) both }
        .correct-glow  { animation: correct-glow .5s ease forwards }
        .wrong-shake   { animation: wrong-shake .45s ease }
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
              ${i < idx ? "w-3 h-3 bg-sky-400" : i === idx ? "w-4 h-4 bg-sky-600" : "w-3 h-3 bg-gray-200"}`} />
          ))}
        </div>
        <button onClick={() => { playSound("tap"); speakEn(q.correct.tts, 0.7, 1.0); }}
          className="w-9 h-9 rounded-full bg-white border border-sky-100 shadow-sm flex items-center justify-center active:scale-90">
          <span className="text-lg">🔊</span>
        </button>
      </div>

      {/* Cards grid */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4">
        <div key={animKey} className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {q.options.map((opt, i) => {
            const isCorrect  = opt.letter === q.correct.letter;
            const isSelected = picked === opt.letter;
            const revealed   = picked !== null;
            let cls = "aspect-square rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all card-pop ";
            if (!revealed)        cls += `${SLOT_BG[i % SLOT_BG.length]} active:scale-95 cursor-pointer shadow-sm`;
            else if (isCorrect)   cls += "bg-emerald-100 border-emerald-400 shadow-lg correct-glow";
            else if (isSelected)  cls += "bg-red-100 border-red-300 wrong-shake";
            else                  cls += "bg-gray-100 border-gray-200 opacity-40";
            return (
              <button key={`${animKey}-${opt.letter}`} onClick={() => pick(opt.letter)}
                disabled={picked !== null} className={cls}
                style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="font-black text-gray-800 leading-none"
                  style={{ fontSize: numChoice <= 2 ? "5.5rem" : "4rem", fontFamily: "serif" }}>
                  {opt.letter}
                </span>
                <span className="text-xs text-gray-400 font-semibold">{opt.word}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-6 flex justify-center shrink-0">
        <span className="text-2xl opacity-40 animate-bounce">👆</span>
      </div>
    </div>
  );
}
