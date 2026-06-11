"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, MicOff, ChevronLeft, X } from "lucide-react";
import type { KidoEmotion } from "@/components/kido/kido-avatar";

const KIDO_CSS = `
@keyframes kidoFloat    { 0%,100%{transform:translateY(0)}          50%{transform:translateY(-8px)} }
@keyframes kidoBob      { 0%,100%{transform:translateY(0) rotate(0deg)}  25%{transform:translateY(-4px) rotate(-3deg)} 75%{transform:translateY(-4px) rotate(3deg)} }
@keyframes kidoBounce   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.1)} }
@keyframes kidoWiggle   { 0%,100%{transform:rotate(0deg)}           25%{transform:rotate(-6deg)} 75%{transform:rotate(6deg)} }
@keyframes kidoPulse    { 0%,100%{transform:scale(1)}               50%{transform:scale(1.07)} }
@keyframes kidoGlow     { 0%,100%{opacity:0.3;transform:scale(1)}   50%{opacity:0.6;transform:scale(1.1)} }
`;

const KIDO_ANIM: Record<KidoEmotion, string> = {
  idle:        "kidoFloat 3s ease-in-out infinite",
  talking:     "kidoBob 0.5s ease-in-out infinite",
  celebrating: "kidoBounce 0.4s ease-in-out infinite",
  thinking:    "kidoWiggle 1.5s ease-in-out infinite",
  listening:   "kidoPulse 1s ease-in-out infinite",
};
import { useProfile } from "@/hooks/use-profile";
import toast from "react-hot-toast";

const GAME_ITEMS = [
  { game: "matching",     emoji: "🧩", label: "เกมจับคู่",    color: "from-violet-400 to-purple-500", say: "ไปหาคู่ที่เหมือนกันกันเถอะ! ฝึกความจำด้วยนะ 🧩" },
  { game: "picture-quiz", emoji: "👆", label: "ชี้รูปภาพ",   color: "from-orange-400 to-amber-500",  say: "มาดูว่าน้องรู้จักคำศัพท์กี่คำแล้ว! 🌟" },
  { game: "flashcard",    emoji: "🃏", label: "บัตรคำ",       color: "from-sky-400 to-blue-500",      say: "มาจำคำใหม่กันเลย! น้องจะเก่งมากเลย ✨" },
  { game: "counting",     emoji: "🔢", label: "นับจำนวน",    color: "from-emerald-400 to-green-500", say: "หนึ่ง สอง สาม! มาฝึกนับด้วยกันเลย 🎯" },
];

const GREETINGS = [
  (name: string) => `สวัสดีน้อง${name}! 😊 วันนี้เราไปเล่นอะไรกันดีนะ?`,
  (name: string) => `ว้าว น้อง${name}มาแล้ว! 🎉 คิโด้รอน้องอยู่เลยนะ!`,
  (name: string) => `ยินดีจัง! 🌟 วันนี้น้อง${name}จะเล่นเกมอะไรกับคิโด้?`,
];

const PRAISE = [
  "เก่งมากเลยนะ! 🎉🎉",
  "ยอดเยี่ยมสุดๆ ไปเลย! ⭐",
  "น้องเก่งมากเลย! 🏆",
  "เจ๋งมากเลย! ✨✨",
];

type Phase = "greeting" | "menu" | "listening" | "thinking" | "responding";

export default function KidoPage() {
  const router = useRouter();
  const { childProfile, childAge } = useProfile();

  const [emotion, setEmotion]         = useState<KidoEmotion>("idle");
  const [speech, setSpeech]           = useState("");
  const [displayed, setDisplayed]     = useState("");
  const [phase, setPhase]             = useState<Phase>("greeting");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const synthRef   = useRef<SpeechSynthesis | null>(null);
  const typeTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef   = useRef<any>(null);

  // Speak a message with typewriter effect
  const speak = useCallback((text: string, em: KidoEmotion = "talking", onEnd?: () => void) => {
    // Cancel previous
    synthRef.current?.cancel();
    if (typeTimer.current) clearInterval(typeTimer.current);

    setSpeech(text);
    setEmotion(em);
    setDisplayed("");

    // Typewriter
    let i = 0;
    typeTimer.current = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length && typeTimer.current) clearInterval(typeTimer.current);
    }, 38);

    // TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const utt = new SpeechSynthesisUtterance(text.replace(/[^฀-๿\s\w.,!?]/g, ""));
      utt.lang    = "th-TH";
      utt.rate    = 0.88;
      utt.pitch   = 1.15;
      utt.volume  = 1;
      utt.onend   = () => {
        setEmotion("idle");
        onEnd?.();
      };
      window.speechSynthesis.speak(utt);
    } else {
      setTimeout(() => {
        setEmotion("idle");
        onEnd?.();
      }, Math.max(1500, text.length * 60));
    }
  }, []);

  // Check voice support
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  // Greeting on mount
  useEffect(() => {
    const name = childProfile?.name ?? "หนู";
    const greetFn = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    const greeting = greetFn(name);
    speak(greeting, "talking", () => setPhase("menu"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
      if (typeTimer.current) clearInterval(typeTimer.current);
      recogRef.current?.abort();
    };
  }, []);

  function handleGameSelect(item: typeof GAME_ITEMS[0]) {
    speak(item.say, "talking", () => {
      router.push(`/dashboard/activities?game=${item.game}`);
    });
  }

  function handlePraise() {
    const p = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    speak(p, "celebrating");
  }

  function startListening() {
    if (isListening) {
      recogRef.current?.stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      toast.error("เบราว์เซอร์นี้ไม่รองรับการฟังเสียงค่ะ");
      return;
    }

    synthRef.current?.cancel();

    const recog = new SR();
    recogRef.current = recog;
    recog.lang = "th-TH";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      setIsListening(true);
      setPhase("listening");
      setEmotion("listening");
      setSpeech("กำลังฟัง...");
      setDisplayed("กำลังฟัง...");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setIsListening(false);
      setPhase("thinking");
      setEmotion("thinking");
      setSpeech(`"${transcript}"`);
      setDisplayed(`"${transcript}"`);

      try {
        const res = await fetch("/api/kido-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: transcript,
            childName: childProfile?.name,
            childAge,
          }),
        });
        const data = await res.json() as { reply: string; emotion?: KidoEmotion; suggestGame?: string | null };
        setPhase("responding");
        speak(data.reply, data.emotion ?? "talking", () => setPhase("menu"));
      } catch {
        speak("โอ๊ะ! คิโด้ฟังไม่ได้ยิน ลองใหม่นะ 😅", "idle", () => setPhase("menu"));
      }
    };

    recog.onerror = () => {
      setIsListening(false);
      setPhase("menu");
      speak("ไม่ได้ยินค่ะ ลองพูดอีกครั้งนะ 😊", "idle");
    };

    recog.onend = () => {
      setIsListening(false);
      if (phase === "listening") setPhase("menu");
    };

    recog.start();
  }

  return (
    /* Full-screen overlay covering sidebar + shell */
    <div className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #be185d 100%)" }}>

      {/* Star field decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animation: `antennaPulse ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <Link href="/dashboard">
          <button className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            กลับ (ผู้ปกครอง)
          </button>
        </Link>
        <div className="text-white/50 text-xs font-medium">Kido – AI Buddy ของลูก 🤖</div>
        <Link href="/dashboard">
          <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center h-[calc(100%-56px)] px-4 pb-safe">

        {/* Kido avatar */}
        <div className="flex-shrink-0 mt-2 relative">
          <style dangerouslySetInnerHTML={{ __html: KIDO_CSS }} />
          {/* Glow behind */}
          <div className="absolute inset-0 rounded-full bg-purple-400/30 blur-3xl scale-125"
            style={{ animation: "kidoGlow 3s ease-in-out infinite" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kido.png"
            alt="Kido"
            width={200}
            height={200}
            style={{ animation: KIDO_ANIM[emotion], objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(139,92,246,0.5))" }}
          />
        </div>

        {/* Speech bubble */}
        <div className={`relative mt-4 mx-auto max-w-xs w-full transition-all duration-300 ${displayed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          {/* Bubble tail */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "14px solid rgba(255,255,255,0.15)" }}
          />
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-3xl px-5 py-4 shadow-xl">
            <p className="text-white text-center text-base font-semibold leading-relaxed min-h-[2.5rem]">
              {displayed || " "}
            </p>
          </div>
        </div>

        {/* Activity grid — shown when in menu phase */}
        {(phase === "menu" || phase === "greeting") && (
          <div className="w-full max-w-sm mt-5">
            <p className="text-white/60 text-xs text-center mb-3 font-medium">เลือกกิจกรรม</p>
            <div className="grid grid-cols-2 gap-3">
              {GAME_ITEMS.map((item) => (
                <button
                  key={item.game}
                  onClick={() => handleGameSelect(item)}
                  className={`bg-gradient-to-br ${item.color} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform`}
                >
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="text-white font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thinking / responding indicator */}
        {(phase === "thinking" || phase === "responding") && (
          <div className="mt-6 flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-white/60"
                style={{ animation: `antennaPulse 0.8s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
            <span className="text-white/60 text-sm ml-1">คิโด้กำลังคิด...</span>
          </div>
        )}

        {/* Bottom controls */}
        <div className="mt-auto pb-6 flex flex-col items-center gap-4 w-full max-w-xs">

          {/* Praise button */}
          <button
            onClick={handlePraise}
            className="text-2xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/30 rounded-full px-5 py-2 text-white font-bold text-sm flex items-center gap-2 transition-colors"
          >
            🏆 น้องทำได้แล้ว!
          </button>

          {/* Mic button */}
          {voiceSupported ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                  isListening
                    ? "bg-red-500 scale-110 shadow-red-400/50 animate-pulse"
                    : "bg-gradient-to-br from-pink-500 to-rose-600 hover:scale-105 shadow-pink-500/40 active:scale-95"
                }`}
              >
                {isListening
                  ? <MicOff className="w-9 h-9 text-white" />
                  : <Mic className="w-9 h-9 text-white" />
                }
              </button>
              <p className="text-white/60 text-xs">
                {isListening ? "กด เพื่อหยุด" : "พูดกับคิโด้"}
              </p>
            </div>
          ) : (
            <p className="text-white/40 text-xs text-center">
              ไม่รองรับการพูดบนเบราว์เซอร์นี้<br />ใช้ Chrome หรือ Safari บนมือถือ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
