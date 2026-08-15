"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Volume2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { useGameExitTracker } from "@/hooks/use-game-exit-tracker";
import { playSound } from "@/lib/sounds";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Zone { cx: number; cy: number; r: number }
interface Question { id: string; th: string; prompt: string; zones: Zone[] }

// ── Questions — SVG viewBox 0 0 260 490 ──────────────────────────────────────
// คำถามเรียงบนลงล่าง เด็กจะประกอบร่างกายทีละชั้น
const QUESTIONS: Question[] = [
  { id: "hair",  th: "ผม",   prompt: "ผมอยู่ตรงไหนนะ",   zones: [{ cx: 130, cy: 42, r: 55 }] },
  { id: "eye",   th: "ตา",   prompt: "ตาอยู่ตรงไหนนะ",   zones: [{ cx: 108, cy: 90, r: 26 }, { cx: 152, cy: 90, r: 26 }] },
  { id: "nose",  th: "จมูก", prompt: "จมูกอยู่ตรงไหนนะ",  zones: [{ cx: 130, cy: 112, r: 22 }] },
  { id: "mouth", th: "ปาก",  prompt: "ปากอยู่ตรงไหนนะ",  zones: [{ cx: 130, cy: 136, r: 25 }] },
  { id: "ear",   th: "หู",   prompt: "หูอยู่ตรงไหนนะ",   zones: [{ cx: 63, cy: 100, r: 25 }, { cx: 197, cy: 100, r: 25 }] },
  { id: "arm",   th: "แขน",  prompt: "แขนอยู่ตรงไหนนะ",  zones: [{ cx: 57, cy: 228, r: 36 }, { cx: 203, cy: 228, r: 36 }] },
  { id: "hand",  th: "มือ",  prompt: "มืออยู่ตรงไหนนะ",  zones: [{ cx: 57, cy: 310, r: 26 }, { cx: 203, cy: 310, r: 26 }] },
  { id: "leg",   th: "ขา",   prompt: "ขาอยู่ตรงไหนนะ",   zones: [{ cx: 107, cy: 366, r: 33 }, { cx: 153, cy: 366, r: 33 }] },
  { id: "foot",  th: "เท้า", prompt: "เท้าอยู่ตรงไหนนะ", zones: [{ cx: 107, cy: 452, r: 28 }, { cx: 153, cy: 452, r: 28 }] },
];

// ── SVG Cartoon Person ────────────────────────────────────────────────────────
function BodySvg({
  revealed,
  wrongDot,
  svgRef,
  onTap,
}: {
  revealed: Set<string>;
  wrongDot: { x: number; y: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svgRef?: React.RefObject<any>;
  onTap?: (e: React.PointerEvent<SVGSVGElement>) => void;
}) {
  const has = (id: string) => revealed.has(id);
  const sk  = "#FFD3A8"; // skin
  const skS = "#E8A870"; // skin stroke

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 260 490"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      onPointerDown={onTap}
      style={{ touchAction: onTap ? "none" : "auto", cursor: onTap ? "pointer" : "default" }}
    >
      <defs>
        <style>{`
          @keyframes part-pop {
            0%   { transform: scale(0.05); opacity: 0 }
            62%  { transform: scale(1.22); opacity: 1 }
            100% { transform: scale(1);    opacity: 1 }
          }
          @keyframes wrong-ring {
            0%   { r: 10; opacity: 0.9 }
            100% { r: 34; opacity: 0 }
          }
          .part-in {
            animation: part-pop .48s cubic-bezier(.34,1.56,.64,1) both;
            transform-box: fill-box;
            transform-origin: center;
          }
        `}</style>
      </defs>

      {/* ── Shoes (darkest, draw first/behind) ─────────────── */}
      <ellipse cx="107" cy="456" rx="30" ry="14" fill="#4A2E1A" stroke="#2E1A0A" strokeWidth="1.5"/>
      <ellipse cx="153" cy="456" rx="30" ry="14" fill="#4A2E1A" stroke="#2E1A0A" strokeWidth="1.5"/>

      {/* ── Legs ──────────────────────────────────────────── */}
      <rect x="86"  y="318" width="38" height="136" rx="16" fill={sk} stroke={skS} strokeWidth="2"/>
      <rect x="136" y="318" width="38" height="136" rx="16" fill={sk} stroke={skS} strokeWidth="2"/>

      {/* ── Shorts ────────────────────────────────────────── */}
      <rect x="80" y="296" width="100" height="48" rx="14" fill="#D93030" stroke="#B01818" strokeWidth="1.5"/>
      <ellipse cx="106" cy="338" rx="21" ry="8" fill="#D93030"/>
      <ellipse cx="154" cy="338" rx="21" ry="8" fill="#D93030"/>

      {/* ── Shirt / Torso ─────────────────────────────────── */}
      <rect x="80" y="178" width="100" height="128" rx="20" fill="#7ECEF4" stroke="#5BBAE0" strokeWidth="2"/>
      {/* collar V */}
      <path d="M109 178 L130 196 L151 178" fill="none" stroke="#5BBAE0" strokeWidth="2" strokeLinejoin="round"/>
      {/* belly button */}
      <circle cx="130" cy="278" r="4" fill="#5BBAE0" opacity="0.55"/>

      {/* ── Arms ──────────────────────────────────────────── */}
      <rect x="36"  y="184" width="42" height="128" rx="19" fill={sk} stroke={skS} strokeWidth="2"/>
      <rect x="182" y="184" width="42" height="128" rx="19" fill={sk} stroke={skS} strokeWidth="2"/>

      {/* ── Hands ─────────────────────────────────────────── */}
      <circle cx="57"  cy="318" r="23" fill={sk} stroke={skS} strokeWidth="2"/>
      <circle cx="203" cy="318" r="23" fill={sk} stroke={skS} strokeWidth="2"/>

      {/* ── Neck ──────────────────────────────────────────── */}
      <rect x="112" y="162" width="36" height="26" fill={sk} stroke={skS} strokeWidth="1.5"/>

      {/* ── Ear silhouettes (always visible) ──────────────── */}
      <ellipse cx="63"  cy="102" rx="14" ry="18" fill={sk} stroke={skS} strokeWidth="2"/>
      <ellipse cx="197" cy="102" rx="14" ry="18" fill={sk} stroke={skS} strokeWidth="2"/>

      {/* ── Head ──────────────────────────────────────────── */}
      <circle cx="130" cy="100" r="70" fill={sk} stroke={skS} strokeWidth="2"/>

      {/* ════════ REVEALED FEATURES ════════ */}

      {/* Hair */}
      {has("hair") && (
        <g className="part-in">
          <ellipse cx="130" cy="38"  rx="63" ry="35" fill="#C46010" stroke="#9A4008" strokeWidth="1.5"/>
          <ellipse cx="69"  cy="74"  rx="18" ry="34" fill="#C46010" stroke="#9A4008" strokeWidth="1.5"/>
          <ellipse cx="191" cy="74"  rx="18" ry="34" fill="#C46010" stroke="#9A4008" strokeWidth="1.5"/>
          {/* sheen */}
          <ellipse cx="118" cy="28" rx="25" ry="10" fill="#E07818" opacity="0.5"/>
        </g>
      )}

      {/* Eyes */}
      {has("eye") && (
        <g className="part-in">
          {/* eyebrows */}
          <path d="M94 74 Q108 68 122 74"  fill="none" stroke="#7B3A08" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M138 74 Q152 68 166 74" fill="none" stroke="#7B3A08" strokeWidth="2.5" strokeLinecap="round"/>
          {/* lashes */}
          <path d="M93 82 Q108 75 123 82"  fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M137 82 Q152 75 167 82" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
          {/* left eye */}
          <ellipse cx="108" cy="92" rx="17" ry="14" fill="white" stroke="#555" strokeWidth="1.5"/>
          <circle cx="108" cy="92" r="9"  fill="#4A2C10"/>
          <circle cx="108" cy="92" r="5"  fill="#1A1010"/>
          <circle cx="112" cy="88" r="3.5" fill="white"/>
          {/* right eye */}
          <ellipse cx="152" cy="92" rx="17" ry="14" fill="white" stroke="#555" strokeWidth="1.5"/>
          <circle cx="152" cy="92" r="9"  fill="#4A2C10"/>
          <circle cx="152" cy="92" r="5"  fill="#1A1010"/>
          <circle cx="156" cy="88" r="3.5" fill="white"/>
        </g>
      )}

      {/* Nose */}
      {has("nose") && (
        <g className="part-in">
          <path d="M124 106 Q121 120 116 124 Q130 131 144 124 Q139 120 136 106"
            fill="none" stroke="#D08050" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="118" cy="123" r="4.5" fill="#D08050" opacity="0.5"/>
          <circle cx="142" cy="123" r="4.5" fill="#D08050" opacity="0.5"/>
        </g>
      )}

      {/* Mouth */}
      {has("mouth") && (
        <g className="part-in">
          <path d="M112 136 Q130 158 148 136" fill="#EF8080" stroke="#CC4040" strokeWidth="2" strokeLinecap="round"/>
          {/* teeth */}
          <path d="M116 137 Q130 148 144 137" fill="white"/>
          {/* tongue */}
          <ellipse cx="130" cy="151" rx="9" ry="5" fill="#FF9090" opacity="0.65"/>
        </g>
      )}

      {/* Ear detail */}
      {has("ear") && (
        <g className="part-in">
          <ellipse cx="63"  cy="102" rx="8"  ry="11" fill={skS} stroke="#CC8848" strokeWidth="1.5"/>
          <ellipse cx="197" cy="102" rx="8"  ry="11" fill={skS} stroke="#CC8848" strokeWidth="1.5"/>
        </g>
      )}

      {/* Arm detail — elbow highlight */}
      {has("arm") && (
        <g className="part-in">
          <ellipse cx="57"  cy="234" rx="13" ry="9" fill={skS} opacity="0.38"/>
          <ellipse cx="203" cy="234" rx="13" ry="9" fill={skS} opacity="0.38"/>
        </g>
      )}

      {/* Hand detail — fingers */}
      {has("hand") && (
        <g className="part-in">
          {[44,52,59,66,73].map((x, i) => (
            <line key={i} x1={x} y1={305} x2={x - 2} y2={290} stroke={skS} strokeWidth="2" strokeLinecap="round"/>
          ))}
          {[217,209,202,195,188].map((x, i) => (
            <line key={i} x1={x} y1={305} x2={x + 2} y2={290} stroke={skS} strokeWidth="2" strokeLinecap="round"/>
          ))}
        </g>
      )}

      {/* Leg detail — knee */}
      {has("leg") && (
        <g className="part-in">
          <ellipse cx="105" cy="366" rx="15" ry="10" fill={skS} opacity="0.35"/>
          <ellipse cx="155" cy="366" rx="15" ry="10" fill={skS} opacity="0.35"/>
        </g>
      )}

      {/* Foot detail — toe bumps */}
      {has("foot") && (
        <g className="part-in">
          {[82,91,100,109,118].map((x, i) => (
            <circle key={i} cx={x} cy={448} r={4.5} fill="#6A4020" opacity="0.6"/>
          ))}
          {[128,137,146,155,164].map((x, i) => (
            <circle key={i} cx={x} cy={448} r={4.5} fill="#6A4020" opacity="0.6"/>
          ))}
        </g>
      )}

      {/* Wrong tap ring animation */}
      {wrongDot && (
        <circle
          cx={wrongDot.x} cy={wrongDot.y} r="14"
          fill="none" stroke="#EF4444" strokeWidth="3"
          style={{ animation: "wrong-ring .55s ease-out both" }}
        />
      )}
    </svg>
  );
}

// ── Speak helper ──────────────────────────────────────────────────────────────
function speak(text: string, rate = 0.78, pitch = 1.15) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH"; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

// ── Page ─────────────────────────────────────────────────────────────────────
type Phase = "intro" | "game" | "done";

export default function BodyTapPage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const { recordResult, justPromoted, promotedToLabel, clearJustPromoted } = useGameDifficulty("body-tap");

  const [phase,      setPhase]     = useState<Phase>("intro");

  const { markRoundStarted } = useGameExitTracker("body-tap", phase);

  const [queue,      setQueue]     = useState<Question[]>([]);
  const [idx,        setIdx]       = useState(0);
  const [revealed,   setRevealed]  = useState<Set<string>>(new Set());
  const [wrongDot,   setWrongDot]  = useState<{ x: number; y: number } | null>(null);
  const [wrongCount, setWrongCount]= useState(0);
  const [totalWrong, setTotalWrong]= useState(0);
  const [locked,     setLocked]    = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const q = queue[idx];

  // Auto-speak on new question
  useEffect(() => {
    if (phase !== "game" || !q) return;
    setLocked(false);
    const t = setTimeout(() => speak(q.prompt), 400);
    return () => clearTimeout(t);
  }, [idx, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save session when done
  useEffect(() => {
    if (phase !== "done" || !queue.length) return;
    const accuracy = Math.min(100, Math.round((queue.length / (queue.length + totalWrong)) * 100));
    const { promoted } = recordResult(accuracy);
    if (promoted) setTimeout(() => playSound("levelUp"), 300);
    else          setTimeout(() => playSound("celebrate"), 200);
    speak("เก่งมากเลย! ประกอบร่างกายครบแล้ว!", 0.82, 1.2);
    saveGameSession({
      gameId: "body-tap", gameName: "ประกอบร่างกาย",
      date: new Date().toISOString().split("T")[0],
      score: queue.length, total: queue.length, accuracy, ts: Date.now(),
    }).catch(console.error);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  function startGame() {
    playSound("tap");
    // ลำดับตายตัว: บนลงล่าง เหมือนวาดคน
    setQueue([...QUESTIONS]);
    setIdx(0); setRevealed(new Set());
    setWrongCount(0); setTotalWrong(0);
    setLocked(false); setPhase("game");
    markRoundStarted();
  }

  function handleTap(e: React.PointerEvent<SVGSVGElement>) {
    if (!q || phase !== "game" || locked) return;
    const svg = svgRef.current;
    if (!svg) return;

    const r = svg.getBoundingClientRect();
    const svgX = ((e.clientX - r.left)  / r.width)  * 260;
    const svgY = ((e.clientY - r.top)   / r.height) * 490;

    const hit = q.zones.some(z => Math.hypot(svgX - z.cx, svgY - z.cy) <= z.r);

    if (hit) {
      setLocked(true);
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(40);
      speak(`เก่งมาก! นั่นแหละ${q.th}เลย!`, 0.82, 1.2);
      setRevealed(prev => new Set([...prev, q.id]));
      setWrongCount(0);
      setTimeout(() => {
        if (idx + 1 >= queue.length) setPhase("done");
        else setIdx(i => i + 1);
      }, 1600);
    } else {
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([55, 25, 55]);
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setTotalWrong(c => c + 1);
      setWrongDot({ x: svgX, y: svgY });
      setTimeout(() => setWrongDot(null), 700);
      if (newWrong >= 2) speak(`ลองดูอีกนะ... ${q.th}`, 0.78, 1.1);
    }
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4 pb-24">
      <div className="max-w-md mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🧩 ประกอบร่างกาย</h1>
            <p className="text-sm text-gray-500">Kido ถาม · แตะตรงนั้น · ประกอบให้ครบ ✨</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0"/>
          <div className="bg-rose-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! 🧩 Kido จะถามว่า "ตาอยู่ตรงไหน?" แล้ว{childName}แตะลงบนรูปเลย!
              ตอบถูกทีละส่วน ประกอบร่างกายให้ครบนะ!
            </p>
            <p className="text-gray-400 text-xs mt-1">9 อวัยวะ · ไม่ต้องอ่าน!</p>
          </div>
        </div>

        {/* Preview — blank person */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col items-center gap-3">
          <div style={{ width: 130, height: 244 }}>
            <BodySvg revealed={new Set()} wrongDot={null} />
          </div>
          <p className="text-xs text-gray-400">แตะถูก → อวัยวะปรากฏขึ้น ✨</p>
        </div>

        <button onClick={startGame}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-rose-500 to-pink-500 active:scale-[0.98] transition-transform">
          🧩 เริ่มประกอบเลย!
        </button>
      </div>
    </div>
  );

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === "done") return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col items-center justify-center p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/kido-celebrate.png" alt="Kido" className="w-28 h-28 object-contain mb-2 animate-bounce"/>

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

      <h2 className="text-3xl font-black text-gray-900 mb-1">ประกอบครบแล้ว! 🎉</h2>
      <p className="text-sm text-gray-400 mb-4">เก่งมากเลย ครบ 9 อวัยวะ!</p>

      {/* Complete figure */}
      <div className="mb-6" style={{ width: 140, height: 264 }}>
        <BodySvg revealed={new Set(QUESTIONS.map(q => q.id))} wrongDot={null} />
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={startGame}
          className="flex-1 py-3.5 rounded-2xl bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95">
          🔄 เล่นใหม่
        </button>
        <Link href="/dashboard" className="flex-1">
          <button className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm active:scale-95">
            กลับหน้าหลัก
          </button>
        </Link>
      </div>
    </div>
  );

  // ── GAME ─────────────────────────────────────────────────────────────────
  if (!q) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col select-none overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1 shrink-0">
        <button onClick={() => { window.speechSynthesis?.cancel(); setPhase("intro"); }}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-90">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5 items-center">
          {queue.map((item, i) => (
            <span key={item.id}
              className={`rounded-full transition-all duration-300 ${
                i < idx        ? "w-3 h-3 bg-rose-400"
                : i === idx    ? "w-4 h-4 bg-rose-600"
                : "w-3 h-3 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Replay */}
        <button onClick={() => { playSound("tap"); speak(q.prompt); }}
          className="w-9 h-9 rounded-full bg-white border border-rose-100 shadow-sm flex items-center justify-center active:scale-90">
          <Volume2 className="w-4 h-4 text-rose-500" />
        </button>
      </div>

      {/* Question pill */}
      <div className="px-4 pt-2 pb-1 flex justify-center shrink-0">
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-lg px-8 py-2.5 rounded-full shadow-md">
          {q.th}อยู่ตรงไหนนะ? 👆
        </div>
      </div>

      {/* Body figure — fills remaining space */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 min-h-0">
        <div
          className="relative"
          style={{
            width: "min(248px, calc(100vw - 48px))",
            aspectRatio: "260 / 490",
          }}
        >
          <BodySvg
            revealed={revealed}
            wrongDot={wrongDot}
            svgRef={svgRef}
            onTap={handleTap}
          />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="px-4 pb-5 text-center shrink-0">
        <p className="text-xs text-gray-400">
          {wrongCount === 0
            ? `แตะตรงที่คิดว่าเป็น${q.th}ได้เลย!`
            : "ยังไม่ถูกนะ... ลองดูอีกครั้ง 😊"}
        </p>
      </div>
    </div>
  );
}
