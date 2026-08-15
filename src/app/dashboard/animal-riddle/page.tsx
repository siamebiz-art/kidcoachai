"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCcw, Volume2, Mic, MicOff } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { useGameExitTracker } from "@/hooks/use-game-exit-tracker";
import { playSound } from "@/lib/sounds";

// ── Riddle database ───────────────────────────────────────────────────────────
interface Riddle { answer: string; answerEn: string; verse: string; emoji: string; aliases?: string[] }

const RIDDLES: Riddle[] = [
  { answer: "วัว",      answerEn: "Cow",       emoji: "🐮", verse: "ตัวโตเขางาม\nร้อง มอ มอ\nอยู่ในคอก",           aliases: ["โค"] },
  { answer: "หนู",      answerEn: "Mouse",     emoji: "🐭", verse: "ตัวเล็กจิ๋ว\nวิ่งหนีแมว\nชอบแทะของ" },
  { answer: "กระต่าย", answerEn: "Rabbit",    emoji: "🐰", verse: "หูยาวตากลม\nกระโดดได้ไกล\nชอบกินแครอท" },
  { answer: "ปลา",     answerEn: "Fish",       emoji: "🐟", verse: "อยู่ในน้ำ\nว่ายไปมา\nหายใจทางเหงือก" },
  { answer: "ช้าง",    answerEn: "Elephant",   emoji: "🐘", verse: "ตัวใหญ่ที่สุด\nมีงวงยาว\nหูใหญ่โต" },
  { answer: "แมว",     answerEn: "Cat",        emoji: "🐱", verse: "ร้อง เหมียว เหมียว\nจับหนูเก่ง\nชอบนอนกลางวัน" },
  { answer: "สุนัข",   answerEn: "Dog",        emoji: "🐶", verse: "ร้อง โฮ่ง โฮ่ง\nเฝ้าบ้านเก่ง\nซื่อสัตย์กับเจ้าของ", aliases: ["หมา"] },
  { answer: "ไก่",     answerEn: "Chicken",    emoji: "🐔", verse: "ตื่นเช้าขัน\nเอ้ก อี เอ้ก\nออกไข่ให้เรากิน" },
  { answer: "เป็ด",    answerEn: "Duck",       emoji: "🦆", verse: "ร้อง ก้าบ ก้าบ\nเดินตวมเตี้ยม\nว่ายน้ำเก่ง" },
  { answer: "นก",      answerEn: "Bird",       emoji: "🐦", verse: "มีปีกบินได้\nร้องเพลงเพราะ\nทำรังบนต้นไม้" },
  { answer: "เต่า",    answerEn: "Turtle",     emoji: "🐢", verse: "เดินช้า ช้า\nมีกระดองแข็ง\nอายุยืนมาก" },
  { answer: "ปู",      answerEn: "Crab",       emoji: "🦀", verse: "เดินไปข้าง ข้าง\nมีก้ามหนีบ\nอยู่ในทะเล" },
  { answer: "กบ",      answerEn: "Frog",       emoji: "🐸", verse: "ร้อง อ๊บ อ๊บ\nกระโดดเก่ง\nอยู่ในสระน้ำ" },
  { answer: "ผีเสื้อ", answerEn: "Butterfly",  emoji: "🦋", verse: "ปีกสวยหลากสี\nบินจากดอกไม้\nเคยเป็นหนอน" },
  { answer: "สิงโต",   answerEn: "Lion",       emoji: "🦁", verse: "เจ้าป่าตัวใหญ่\nมีขนรอบคอ\nเสียงคำราม" },
  { answer: "ผึ้ง",    answerEn: "Bee",        emoji: "🐝", verse: "ตัวเล็กบินได้\nทำน้ำผึ้งหวาน\nมีเหล็กใน", aliases: ["แมลงผึ้ง"] },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase       = "setup" | "game" | "done";
type ListenState = "idle" | "listening" | "result";

const ROUNDS_OPTIONS = [6, 10, 16] as const;
type RoundsOption = typeof ROUNDS_OPTIONS[number];
const ROUNDS_LABEL: Record<RoundsOption, string> = { 6: "6 ใบ (เร็ว)", 10: "10 ใบ", 16: "16 ใบ (ทั้งหมด)" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function isCorrect(heard: string, riddle: Riddle): boolean {
  const h = heard.trim().replace(/\s+/g, "");
  const candidates = [riddle.answer, ...(riddle.aliases ?? [])];
  return candidates.some(c => h.includes(c) || c.includes(h));
}

function speakRiddle(verse: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const intro = new SpeechSynthesisUtterance("อะไรเอ่ย?");
  intro.lang = "th-TH"; intro.rate = 0.78; intro.pitch = 1.25;

  const body = new SpeechSynthesisUtterance(verse.replace(/\n/g, "... "));
  body.lang = "th-TH"; body.rate = 0.75; body.pitch = 1.1;

  window.speechSynthesis.speak(intro);
  window.speechSynthesis.speak(body);
}

// ── Component ─────────────────────────────────────────────────────────────────
// difficulty → rounds: easy=6, medium=10, hard=16
const DIFF_TO_ROUNDS: Record<string, RoundsOption> = { easy: 6, medium: 10, hard: 16 };

export default function AnimalRiddlePage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const { difficulty, diffLabel, recordResult, justPromoted, promotedToLabel, clearJustPromoted } = useGameDifficulty("animal-riddle");

  const [phase,       setPhase]       = useState<Phase>("setup");

  const { markRoundStarted } = useGameExitTracker("animal-riddle", phase);

  const [rounds,      setRounds]      = useState<RoundsOption>(6);
  const [qs,          setQs]          = useState<Riddle[]>([]);
  const [idx,         setIdx]         = useState(0);
  const [score,       setScore]       = useState(0);
  const [speaking,    setSpeaking]    = useState(false);
  const [listenState, setListenState] = useState<ListenState>("idle");
  const [recognized,  setRecognized]  = useState<string | null>(null);
  const [autoCorrect, setAutoCorrect] = useState<boolean | null>(null);
  const [hasStt,      setHasStt]      = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef  = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = qs[idx];

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setHasStt(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  // ── Sync rounds จาก difficulty hook ────────────────────────────────────────
  useEffect(() => {
    setRounds(DIFF_TO_ROUNDS[difficulty] ?? 6);
  }, [difficulty]);

  // ── บันทึก session เมื่อเกมจบ ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "done" && qs.length > 0) {
      const accuracy = Math.round((score / qs.length) * 100);
      const { promoted } = recordResult(accuracy);
      if (promoted) { playSound("levelUp"); }
      else if (accuracy >= 80) { playSound("celebrate"); }
      saveGameSession({
        gameId: "animal-riddle",
        gameName: "อะไรเอ่ย?",
        date: new Date().toISOString().split("T")[0],
        score,
        total: qs.length,
        accuracy,
        ts: Date.now(),
      }).catch(console.error);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speak = useCallback((verse: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    if (pollRef.current) clearInterval(pollRef.current);
    setSpeaking(true);
    speakRiddle(verse);
    pollRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        if (pollRef.current) clearInterval(pollRef.current);
        setSpeaking(false);
      }
    }, 300);
  }, []);

  // auto-speak on new question
  useEffect(() => {
    if (phase === "game" && listenState === "idle" && q) {
      const t = setTimeout(() => speak(q.verse), 420);
      return () => clearTimeout(t);
    }
  }, [idx, phase, q, speak]); // eslint-disable-line react-hooks/exhaustive-deps

  // cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (pollRef.current) clearInterval(pollRef.current);
      recRef.current?.abort();
    };
  }, []);

  // ── STT ───────────────────────────────────────────────────────────────────
  function startListening() {
    if (!q) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      // fallback → self-score
      setListenState("result");
      setRecognized(null);
      setAutoCorrect(null);
      return;
    }

    window.speechSynthesis.cancel(); // stop TTS if still going
    setSpeaking(false);

    const rec = new SR();
    rec.lang             = "th-TH";
    rec.continuous       = false;
    rec.interimResults   = false;
    rec.maxAlternatives  = 3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const heard = e.results[0][0].transcript;
      const correct = isCorrect(heard, q);
      setRecognized(heard);
      setAutoCorrect(correct);
      setListenState("result");
      if (correct) {
        playSound("correct");
        setScore(s => s + 1);
        if (navigator.vibrate) navigator.vibrate(40);
      } else {
        playSound("wrong");
        if (navigator.vibrate) navigator.vibrate([70, 30, 70]);
      }
    };

    rec.onerror = () => {
      setRecognized(null);
      setAutoCorrect(null);
      setListenState("result");
    };

    rec.onend = () => {
      if (listenState === "listening") {
        setListenState("result");
      }
    };

    recRef.current = rec;
    rec.start();
    setListenState("listening");
  }

  function stopListening() {
    recRef.current?.stop();
    setListenState("result");
    setRecognized(null);
    setAutoCorrect(null);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function advance() {
    recRef.current?.abort();
    recRef.current = null;
    if (idx + 1 >= qs.length) {
      setPhase("done");
    } else {
      setIdx(i => i + 1);
      setListenState("idle");
      setRecognized(null);
      setAutoCorrect(null);
    }
  }

  function startGame() {
    setQs(shuffle(RIDDLES).slice(0, rounds));
    setIdx(0); setScore(0);
    setListenState("idle"); setRecognized(null); setAutoCorrect(null);
    setPhase("game");
    markRoundStarted();
  }

  function reset() {
    window.speechSynthesis?.cancel();
    recRef.current?.abort();
    setPhase("setup");
    setListenState("idle");
    setRecognized(null); setAutoCorrect(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-md mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🎭 อะไรเอ่ย?</h1>
            <p className="text-sm text-gray-500">ฟังปริศนา · พูดตอบ · ดูเฉลย ✨</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-pink-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! 🎭 Kido จะพูดปริศนา แล้ว{childName}ลองตอบออกเสียงดูนะ!
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {hasStt ? "🎤 Kido ฟังคำตอบได้เลย!" : "กดเฉลยเมื่อพร้อม"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">เล่นกี่ใบ?</p>
          <div className="flex flex-col gap-2.5">
            {ROUNDS_OPTIONS.map(n => {
              const sel = rounds === n;
              return (
                <button key={n} onClick={() => { playSound("tap"); setRounds(n); }}
                  className={`rounded-2xl p-4 border-2 flex items-center gap-4 active:scale-[0.97] transition-all
                    ${sel ? "border-pink-300 bg-pink-50" : "border-gray-100 bg-gray-50"}`}>
                  <span className="text-2xl">{n === 6 ? "⚡" : n === 10 ? "🌸" : "🎯"}</span>
                  <div className="text-left flex-1">
                    <div className={`font-black text-sm ${sel ? "text-pink-700" : "text-gray-500"}`}>{ROUNDS_LABEL[n]}</div>
                    <div className="text-xs text-gray-400">สัตว์ {n} ชนิด · สับใหม่ทุกรอบ</div>
                  </div>
                  {sel && <span className="font-bold text-sm text-pink-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => { playSound("tap"); startGame(); }}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-pink-500 to-purple-500 active:scale-[0.98] transition-transform">
          🎭 เริ่มเลย!
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = score / qs.length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kido-celebrate.png" alt="Kido" className="w-32 h-32 object-contain mb-3 animate-bounce" />
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          {pct >= 0.8 ? "เก่งมากเลย! 🎉" : pct >= 0.5 ? "ทำได้ดีมาก! 👏" : "ลองอีกครั้งนะ 💪"}
        </h2>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-black text-pink-500">{score}</span>
          <span className="text-xl text-gray-400">/ {qs.length}</span>
        </div>
        <p className="text-gray-400 text-sm mb-6">ตอบถูก</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={startGame}
            className="flex-1 py-3.5 rounded-2xl bg-pink-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
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

  // ─────────────────────────────────────────────────────────────────────────
  // GAME
  // ─────────────────────────────────────────────────────────────────────────
  if (!q) return null;
  const progress = (idx / qs.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      <style>{`
        @keyframes card-in  { 0%{transform:scale(.85) translateY(24px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes result-in{ 0%{transform:scale(.6);opacity:0} 65%{transform:scale(1.06);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes mic-ring { 0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,.4)} 60%{box-shadow:0 0 0 16px rgba(236,72,153,0)} }
        @keyframes bar-up   { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
        .card-in   { animation: card-in   .38s cubic-bezier(.25,.8,.25,1) both }
        .result-in { animation: result-in .44s cubic-bezier(.34,1.56,.64,1) both }
        .mic-ring  { animation: mic-ring 1.2s ease-out infinite }
        .speak-bar { display:inline-block;width:3px;border-radius:2px;background:rgba(255,255,255,.9);transform-origin:bottom;animation:bar-up .65s ease-in-out infinite }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={reset}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <div className="font-black text-sm text-gray-800">🎭 อะไรเอ่ย?</div>
          <div className="text-xs text-gray-400">ข้อ {idx + 1} / {qs.length}</div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-50">
          <span className="font-black text-pink-600 text-sm">⭐ {score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 mb-3 shrink-0">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4 py-2">
        <div key={idx} className="w-full max-w-sm card-in">

          {/* ── Riddle card ── */}
          <div className="bg-white rounded-3xl shadow-md border border-pink-100 overflow-hidden">

            {/* header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-xl">อะไรเอ่ย?</span>
                {speaking && (
                  <span className="flex gap-0.5 items-end h-4 ml-1">
                    {[0, 0.15, 0.3].map(d => (
                      <span key={d} className="speak-bar" style={{ height: "8px", animationDelay: `${d}s` }} />
                    ))}
                  </span>
                )}
              </div>
              <button onClick={() => speak(q.verse)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center active:scale-90 transition-all">
                <Volume2 className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* verse blob */}
            <div className="px-6 pt-7 pb-4 flex flex-col items-center gap-5">
              <div className="relative flex items-center justify-center w-[220px] h-[175px]">
                <svg className="absolute" viewBox="0 0 220 175" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="110" cy="88" rx="102" ry="78" fill="#FBD0E6" />
                </svg>
                <div className="relative z-10 text-center px-4">
                  {q.verse.split("\n").map((line, i) => (
                    <p key={i} className="text-[22px] font-black text-rose-900 leading-snug">{line}</p>
                  ))}
                </div>
              </div>

              {/* ── Interaction zone ── */}
              {listenState === "idle" && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <p className="text-xs text-gray-400 font-medium">
                    {speaking ? "🔊 กำลังพูด... ฟังดูนะ!" : hasStt ? "🎤 กดปุ่มแล้วพูดคำตอบได้เลย" : "คิดคำตอบได้แล้ว กดเฉลย"}
                  </p>
                  {hasStt ? (
                    <button onClick={startListening} disabled={speaking}
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all
                        ${speaking
                          ? "bg-gray-200 cursor-not-allowed"
                          : "bg-gradient-to-br from-pink-500 to-purple-600 active:scale-90"}`}>
                      <Mic className="w-7 h-7 text-white" />
                    </button>
                  ) : (
                    <button onClick={() => setListenState("result")}
                      className="px-8 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-green-500 to-emerald-500 active:scale-95 transition-transform">
                      👁️ เฉลย
                    </button>
                  )}
                </div>
              )}

              {listenState === "listening" && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <p className="text-sm font-black text-pink-600 animate-pulse">🎤 กำลังฟัง...</p>
                  <button onClick={stopListening}
                    className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center shadow-lg mic-ring active:scale-90 transition-transform">
                    <Mic className="w-7 h-7 text-white" />
                  </button>
                  <p className="text-xs text-gray-400">กดอีกครั้งเพื่อหยุด</p>
                </div>
              )}

              {listenState === "result" && (
                <div className="result-in flex flex-col items-center gap-3 w-full">
                  {/* auto-scored */}
                  {autoCorrect !== null ? (
                    <>
                      <div className={`w-full rounded-2xl p-3 text-center ${autoCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        <p className={`text-lg font-black ${autoCorrect ? "text-emerald-700" : "text-red-600"}`}>
                          {autoCorrect ? "🎉 ถูกต้อง!" : `❌ ที่ถูกคือ "${q.answer}"`}
                        </p>
                        {recognized && (
                          <p className="text-xs text-gray-400 mt-0.5">ได้ยิน: "{recognized}"</p>
                        )}
                      </div>
                      <div className="text-5xl">{q.emoji}</div>
                      <p className="font-black text-xl text-gray-800">{q.answer} <span className="text-base font-semibold text-indigo-400">{q.answerEn}</span></p>
                    </>
                  ) : (
                    /* fallback self-score */
                    <>
                      <div className="text-5xl">{q.emoji}</div>
                      <p className="font-black text-xl text-gray-800">{q.answer} <span className="text-base font-semibold text-indigo-400">{q.answerEn}</span></p>
                      <p className="text-xs text-gray-400 font-medium">ทายถูกไหม?</p>
                      <div className="flex gap-3 w-full">
                        <button onClick={() => { playSound("correct"); setScore(s => s + 1); advance(); }}
                          className="flex-1 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-500 to-green-500 active:scale-95 transition-transform">
                          ✅ ถูกต้อง!
                        </button>
                        <button onClick={() => { playSound("wrong"); advance(); }}
                          className="flex-1 py-3 rounded-2xl font-black text-sm text-gray-600 bg-gray-100 active:scale-95 transition-transform">
                          😅 ยังไม่รู้
                        </button>
                      </div>
                    </>
                  )}

                  {autoCorrect !== null && (
                    <button onClick={advance}
                      className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 active:scale-95 transition-transform mt-1">
                      {idx + 1 < qs.length ? "ถัดไป →" : "ดูผลสรุป 🎯"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-1 shrink-0 text-center">
        <p className="text-xs text-gray-400">
          {listenState === "idle" && (speaking ? "🔊 ฟังปริศนาก่อน แล้วค่อยตอบ" : hasStt ? "กดไมค์แล้วพูดชื่อสัตว์" : "คิดคำตอบแล้ว กดเฉลย")}
          {listenState === "listening" && "Kido กำลังฟัง... พูดชื่อสัตว์ได้เลย"}
          {listenState === "result" && (idx + 1 < qs.length ? "กด ถัดไป เพื่อข้อต่อไป" : "กด ดูผลสรุป เมื่อพร้อม")}
        </p>
      </div>
    </div>
  );
}
