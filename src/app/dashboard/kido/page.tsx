"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Mic, MicOff, ChevronLeft, X, BarChart2 } from "lucide-react";
import type { KidoEmotion } from "@/components/kido/kido-avatar";
import { useProfile } from "@/hooks/use-profile";
import toast from "react-hot-toast";
import { MemoryMatchGame }  from "@/app/dashboard/activities/memory-game";
import { PictureQuizGame }  from "@/app/dashboard/activities/picture-quiz";
import { FlashcardGame }    from "@/app/dashboard/activities/flashcard-game";
import { CountingGame }     from "@/app/dashboard/activities/counting-game";
import { SortingGame }      from "@/app/dashboard/activities/sorting-game";

/* ─── animations ─── */
const KIDO_CSS = `
@keyframes kidoFloat    { 0%,100%{transform:translateY(0)}         50%{transform:translateY(-8px)} }
@keyframes kidoBob      { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-4px) rotate(-3deg)} 75%{transform:translateY(-4px) rotate(3deg)} }
@keyframes kidoBounce   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.1)} }
@keyframes kidoWiggle   { 0%,100%{transform:rotate(0deg)}          25%{transform:rotate(-6deg)} 75%{transform:rotate(6deg)} }
@keyframes kidoPulse    { 0%,100%{transform:scale(1)}              50%{transform:scale(1.07)} }
@keyframes kidoGlow     { 0%,100%{opacity:0.3;transform:scale(1)}  50%{opacity:0.6;transform:scale(1.1)} }
`;
const KIDO_ANIM: Record<KidoEmotion, string> = {
  idle:        "kidoFloat 3s ease-in-out infinite",
  talking:     "kidoBob 0.5s ease-in-out infinite",
  celebrating: "kidoBounce 0.4s ease-in-out infinite",
  thinking:    "kidoWiggle 1.5s ease-in-out infinite",
  listening:   "kidoPulse 1s ease-in-out infinite",
};

/* ─── game registry ─── */
const GAME_ITEMS = [
  { game: "matching",     emoji: "🧩", label: "เกมจับคู่",    color: "from-violet-400 to-purple-500", say: "ไปหาคู่ที่เหมือนกันกันเถอะ! ฝึกความจำด้วยนะ 🧩" },
  { game: "picture-quiz", emoji: "👆", label: "ชี้รูปภาพ",   color: "from-orange-400 to-amber-500",  say: "มาดูว่าน้องรู้จักคำศัพท์กี่คำแล้ว! 🌟" },
  { game: "flashcard",    emoji: "🃏", label: "บัตรคำ",       color: "from-sky-400 to-blue-500",      say: "มาจำคำใหม่กันเลย! น้องจะเก่งมากเลย ✨" },
  { game: "counting",     emoji: "🔢", label: "นับจำนวน",    color: "from-emerald-400 to-green-500", say: "หนึ่ง สอง สาม! มาฝึกนับด้วยกันเลย 🎯" },
  { game: "sorting",      emoji: "🗂️", label: "จัดหมวดหมู่", color: "from-rose-400 to-pink-500",     say: "มาจัดหมวดหมู่กันเถอะ! ฝึกแยกประเภทด้วยนะ 🗂️" },
] as const;
type GameId = typeof GAME_ITEMS[number]["game"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GAME_MAP: Record<GameId, React.ComponentType<{ onBack: () => void; onComplete: () => void }>> = {
  "matching":     MemoryMatchGame,
  "picture-quiz": PictureQuizGame,
  "flashcard":    FlashcardGame,
  "counting":     CountingGame,
  "sorting":      SortingGame,
};

/* ─── stats (localStorage) ─── */
const STATS_KEY = "kidocoachai-stats";
type GameStat = { plays: number; lastPlayed: string };
type StatsMap = Record<string, GameStat>;

function loadStats(): StatsMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveStats(s: StatsMap) {
  if (typeof window !== "undefined") localStorage.setItem(STATS_KEY, JSON.stringify(s));
}
function recordPlay(gameId: string, prev: StatsMap): StatsMap {
  const today = new Date().toISOString().slice(0, 10);
  const existing = prev[gameId] ?? { plays: 0, lastPlayed: today };
  const next = { ...prev, [gameId]: { plays: existing.plays + 1, lastPlayed: today } };
  saveStats(next);
  return next;
}

/* ─── misc ─── */
const GREETINGS = [
  (n: string) => `สวัสดีน้อง${n}! 😊 วันนี้เราไปเล่นอะไรกันดีนะ?`,
  (n: string) => `ว้าว น้อง${n}มาแล้ว! 🎉 คิโด้รอน้องอยู่เลยนะ!`,
  (n: string) => `ยินดีจัง! 🌟 วันนี้น้อง${n}จะเล่นเกมอะไรกับคิโด้?`,
];
const PRAISE = ["เก่งมากเลยนะ! 🎉🎉", "ยอดเยี่ยมสุดๆ ไปเลย! ⭐", "น้องเก่งมากเลย! 🏆", "เจ๋งมากเลย! ✨✨"];
type Phase = "greeting" | "menu" | "listening" | "thinking" | "responding";

/* ══════════════════════════════════════════════════ */
export default function KidoPage() {
  const { childProfile, childAge } = useProfile();

  const [emotion, setEmotion]       = useState<KidoEmotion>("idle");
  const [displayed, setDisplayed]   = useState("");
  const [phase, setPhase]           = useState<Phase>("greeting");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [stats, setStats]           = useState<StatsMap>({});
  const [showStats, setShowStats]   = useState(false);

  const synthRef  = useRef<SpeechSynthesis | null>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef  = useRef<any>(null);

  /* ── speak ── */
  const speak = useCallback((text: string, em: KidoEmotion = "talking", onEnd?: () => void) => {
    synthRef.current?.cancel();
    if (typeTimer.current) clearInterval(typeTimer.current);
    setEmotion(em);
    setDisplayed("");
    let i = 0;
    typeTimer.current = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length && typeTimer.current) clearInterval(typeTimer.current);
    }, 38);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const utt = new SpeechSynthesisUtterance(text.replace(/[^฀-๿\s\w.,!?]/g, ""));
      utt.lang = "th-TH"; utt.rate = 0.88; utt.pitch = 1.15; utt.volume = 1;
      utt.onend = () => { setEmotion("idle"); onEnd?.(); };
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => { setEmotion("idle"); onEnd?.(); }, Math.max(1500, text.length * 60));
    }
  }, []);

  /* ── init ── */
  useEffect(() => {
    setStats(loadStats());
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  useEffect(() => {
    const name = childProfile?.name ?? "หนู";
    const fn = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    speak(fn(name), "talking", () => setPhase("menu"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    synthRef.current?.cancel();
    if (typeTimer.current) clearInterval(typeTimer.current);
    recogRef.current?.abort();
  }, []);

  /* ── game handlers ── */
  function handleGameSelect(item: typeof GAME_ITEMS[number]) {
    speak(item.say, "talking", () => setActiveGame(item.game));
  }

  function handleGameBack() {
    setActiveGame(null);
    speak("กลับมาดีจัง! เลือกเกมใหม่ได้เลย!", "talking", () => setPhase("menu"));
    setPhase("menu");
  }

  function handleGameComplete() {
    const finished = activeGame!;
    setStats((prev) => recordPlay(finished, prev));
    setActiveGame(null);
    setPhase("menu");

    // suggest a random different game
    const others = GAME_ITEMS.filter((g) => g.game !== finished);
    const next = others[Math.floor(Math.random() * others.length)];
    const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    speak(`${praise} ลองเล่น${next.label}ต่อไหมนะ?`, "celebrating");
  }

  /* ── voice chat ── */
  function handlePraise() {
    speak(PRAISE[Math.floor(Math.random() * PRAISE.length)], "celebrating");
  }

  function startListening() {
    if (isListening) { recogRef.current?.stop(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("เบราว์เซอร์นี้ไม่รองรับการฟังเสียงค่ะ"); return; }
    synthRef.current?.cancel();
    const recog = new SR();
    recogRef.current = recog;
    recog.lang = "th-TH"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onstart = () => { setIsListening(true); setPhase("listening"); setEmotion("listening"); setDisplayed("กำลังฟัง..."); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false); setPhase("thinking"); setEmotion("thinking"); setDisplayed(`"${transcript}"`);
      try {
        const res = await fetch("/api/kido-chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript, childName: childProfile?.name, childAge }),
        });
        const data = await res.json() as { reply: string; emotion?: KidoEmotion };
        setPhase("responding");
        speak(data.reply, data.emotion ?? "talking", () => setPhase("menu"));
      } catch {
        speak("โอ๊ะ! คิโด้ฟังไม่ได้ยิน ลองใหม่นะ 😅", "idle", () => setPhase("menu"));
      }
    };
    recog.onerror = () => { setIsListening(false); setPhase("menu"); speak("ไม่ได้ยินค่ะ ลองพูดอีกครั้งนะ 😊", "idle"); };
    recog.onend = () => { setIsListening(false); if (phase === "listening") setPhase("menu"); };
    recog.start();
  }

  /* ══ render active game ══ */
  if (activeGame) {
    const GameComponent = GAME_MAP[activeGame];
    const gameInfo = GAME_ITEMS.find((g) => g.game === activeGame)!;
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50">
        {/* Slim Kido bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0">
          <button onClick={handleGameBack} className="flex items-center gap-1 text-white/80 hover:text-white text-xs transition-colors">
            <ChevronLeft className="w-4 h-4" /> หน้า Kido
          </button>
          <div className="flex-1 text-center text-white text-xs font-bold">{gameInfo.emoji} {gameInfo.label}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido.png" alt="Kido" className="w-8 h-8 object-contain" />
        </div>
        {/* Game */}
        <div className="flex-1 overflow-y-auto">
          <GameComponent onBack={handleGameBack} onComplete={handleGameComplete} />
        </div>
      </div>
    );
  }

  /* ══ render Kido menu ══ */
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #be185d 100%)" }}>

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.1 }} />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <button className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> กลับ (ผู้ปกครอง)
          </button>
        </Link>
        <div className="text-white/50 text-xs font-medium">Kido – AI Buddy ของลูก 🤖</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowStats(true)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="ดูสถิติ">
            <BarChart2 className="w-4 h-4 text-white/60" />
          </button>
          <Link href="/dashboard">
            <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </Link>
        </div>
      </div>

      {/* Main scroll area */}
      <div className="relative z-10 flex flex-col items-center h-[calc(100%-56px)] overflow-y-auto px-4 pb-6">

        {/* Kido avatar */}
        <div className="relative mt-1 shrink-0">
          <style dangerouslySetInnerHTML={{ __html: KIDO_CSS }} />
          <div className="absolute inset-0 rounded-full bg-purple-400/30 blur-3xl scale-125"
            style={{ animation: "kidoGlow 3s ease-in-out infinite" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido.png" alt="Kido" className="w-36 h-36 sm:w-44 sm:h-44"
            style={{ animation: KIDO_ANIM[emotion], objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.5))" }} />
        </div>

        {/* Speech bubble */}
        <div className={`relative mt-2 mx-auto max-w-xs w-full transition-all duration-300 ${displayed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "12px solid rgba(255,255,255,0.15)" }} />
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-3xl px-4 py-3 shadow-xl">
            <p className="text-white text-center text-sm font-semibold leading-relaxed min-h-[2rem]">{displayed || " "}</p>
          </div>
        </div>

        {/* Game tiles */}
        {(phase === "menu" || phase === "greeting") && (
          <div className="w-full max-w-sm mt-3 shrink-0">
            <p className="text-white/60 text-xs text-center mb-2 font-medium">เลือกกิจกรรม</p>
            <div className="grid grid-cols-2 gap-2.5">
              {GAME_ITEMS.map((item) => {
                const s = stats[item.game];
                return (
                  <button key={item.game} onClick={() => handleGameSelect(item)}
                    className={`bg-gradient-to-br ${item.color} rounded-2xl p-3 flex flex-col items-center gap-1 shadow-lg active:scale-95 transition-transform relative`}>
                    {s && (
                      <span className="absolute top-1.5 right-1.5 bg-black/30 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                        {s.plays}ครั้ง
                      </span>
                    )}
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="text-white font-bold text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {(phase === "thinking" || phase === "responding") && (
          <div className="mt-4 flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
            <span className="text-white/60 text-sm ml-1">คิโด้กำลังคิด...</span>
          </div>
        )}

        {/* Bottom controls */}
        <div className="mt-4 flex flex-col items-center gap-3 w-full max-w-xs shrink-0">
          <button onClick={handlePraise}
            className="bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/30 rounded-full px-5 py-2 text-white font-bold text-sm flex items-center gap-2 transition-colors">
            🏆 น้องทำได้แล้ว!
          </button>
          {voiceSupported ? (
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={startListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                  isListening ? "bg-red-500 scale-110 animate-pulse" : "bg-gradient-to-br from-pink-500 to-rose-600 hover:scale-105 active:scale-95"
                }`}>
                {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
              </button>
              <p className="text-white/60 text-xs">{isListening ? "กด เพื่อหยุด" : "พูดกับคิโด้"}</p>
            </div>
          ) : (
            <p className="text-white/40 text-xs text-center">ไม่รองรับการพูดบนเบราว์เซอร์นี้<br />ใช้ Chrome หรือ Safari บนมือถือ</p>
          )}
        </div>
      </div>

      {/* Stats modal */}
      {showStats && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4" onClick={() => setShowStats(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">📊 สถิติการเล่น</h2>
              <button onClick={() => setShowStats(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-2">
              {GAME_ITEMS.map((item) => {
                const s = stats[item.game];
                return (
                  <div key={item.game} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{s ? `เล่นล่าสุด ${s.lastPlayed}` : "ยังไม่เคยเล่น"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">{s?.plays ?? 0}</p>
                      <p className="text-[10px] text-gray-400">ครั้ง</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(stats).length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-3">เริ่มเล่นเกมแรกได้เลย! 🎮</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
