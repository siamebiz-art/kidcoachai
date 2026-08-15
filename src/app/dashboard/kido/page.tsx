"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Mic, MicOff, ChevronLeft, X, BarChart2, Brain } from "lucide-react";
import type { KidoEmotion } from "@/components/kido/kido-avatar";
import type { GameResult, GameSession } from "@/lib/types";
import { useProfile } from "@/hooks/use-profile";
import { KidoBreakOverlay } from "@/components/kido/kido-break-overlay";
import { KidoMissionOverlay } from "@/components/kido/kido-mission-overlay";
import { addScreenMinute, loadDailyData, randomMission, syncDailyData, beaconDailyData, type Mission } from "@/lib/daily-data";
import toast from "react-hot-toast";
import { MemoryMatchGame }   from "@/app/dashboard/activities/memory-game";
import { PictureQuizGame }   from "@/app/dashboard/activities/picture-quiz";
import { FlashcardGame }     from "@/app/dashboard/activities/flashcard-game";
import { CountingGame }      from "@/app/dashboard/activities/counting-game";
import { SortingGame }       from "@/app/dashboard/activities/sorting-game";
import { EmotionGame }       from "@/app/dashboard/activities/emotion-game";
import { ShapesGame }        from "@/app/dashboard/activities/shapes-game";
import { SequenceGame }      from "@/app/dashboard/activities/sequence-game";
import { BubblePopGame }     from "@/app/dashboard/activities/bubble-pop-game";
import { OppositeGame }      from "@/app/dashboard/activities/opposite-game";
import { DialogueGame }      from "@/app/dashboard/activities/dialogue-game";
import { NeedsGame }         from "@/app/dashboard/activities/needs-game";
import { OddOneOutGame }     from "@/app/dashboard/activities/odd-one-out-game";
import { RhythmGame }        from "@/app/dashboard/activities/rhythm-game";
import { WordCategoryGame }  from "@/app/dashboard/activities/word-category-game";
import { ColorGame }         from "@/app/dashboard/activities/color-game";

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
const KIDO_IMG: Record<KidoEmotion, string> = {
  idle:        "/kido.png",
  talking:     "/kido-point.png",
  celebrating: "/kido-celebrate.png",
  thinking:    "/kido-think.png",
  listening:   "/kido.png",
};

/* ─── game registry ─── */
const GAME_ITEMS = [
  { game: "matching",       emoji: "🧩", label: "เกมจับคู่",        color: "from-violet-400 to-purple-500",  say: "ไปหาคู่ที่เหมือนกันกันเถอะ! ฝึกความจำด้วยนะ 🧩" },
  { game: "picture-quiz",   emoji: "👆", label: "ชี้รูปภาพ",       color: "from-orange-400 to-amber-500",   say: "มาดูว่าน้องรู้จักคำศัพท์กี่คำแล้ว! 🌟" },
  { game: "flashcard",      emoji: "🃏", label: "บัตรคำ",           color: "from-sky-400 to-blue-500",       say: "มาจำคำใหม่กันเลย! น้องจะเก่งมากเลย ✨" },
  { game: "counting",       emoji: "🔢", label: "นับจำนวน",        color: "from-emerald-400 to-green-500",  say: "หนึ่ง สอง สาม! มาฝึกนับด้วยกันเลย 🎯" },
  { game: "sorting",        emoji: "🗂️", label: "จัดหมวดหมู่",   color: "from-rose-400 to-pink-500",      say: "มาจัดหมวดหมู่กันเถอะ! ฝึกแยกประเภทด้วยนะ 🗂️" },
  { game: "quiz-fruits",    emoji: "🍎", label: "ชี้รูปผลไม้",     color: "from-red-400 to-rose-500",       say: "มาชี้รูปผลไม้กัน! น้องรู้จักผลไม้อะไรบ้างนะ? 🍎" },
  { game: "quiz-pets",      emoji: "🐾", label: "ชี้สัตว์เลี้ยง",  color: "from-amber-400 to-orange-500",   say: "มาชี้สัตว์เลี้ยงกัน! น้องชอบสัตว์ตัวไหนนะ? 🐾" },
  { game: "quiz-household", emoji: "🏠", label: "ของในบ้าน",        color: "from-teal-400 to-cyan-500",      say: "มาชี้ของในบ้านกัน! น้องรู้จักของพวกนี้ไหมนะ? 🏠" },
  { game: "quiz-school",    emoji: "📚", label: "อุปกรณ์การเรียน",  color: "from-blue-400 to-indigo-500",    say: "มาชี้อุปกรณ์การเรียนกัน! น้องใช้ของพวกนี้อยู่เลย! 📚" },
  { game: "quiz-personal",  emoji: "🧼", label: "ของใช้ส่วนตัว",   color: "from-pink-400 to-fuchsia-500",   say: "มาชี้ของใช้ส่วนตัวกัน! น้องใช้ของพวกนี้ทุกวันเลยนะ? 🧼" },
  { game: "emotion",        emoji: "🫀", label: "รู้จักอารมณ์",    color: "from-pink-400 to-rose-500",      say: "มาดูว่าน้องรู้สึกอะไรอยู่! ฝึก EQ กันเลยนะ 😊" },
  { game: "shapes",         emoji: "🔴", label: "รูปทรงและสี",     color: "from-blue-400 to-indigo-500",    say: "มาจับคู่รูปทรงและสีกัน! น้องจะชอบเลย 🔴" },
  { game: "sequence",       emoji: "📋", label: "เรียงลำดับ",      color: "from-teal-400 to-cyan-500",      say: "มาเรียงเหตุการณ์ให้ถูกลำดับกัน! ฝึกการคิดนะ 📋" },
  { game: "bubble-pop",     emoji: "🫧", label: "ป๊อปบับเบิล",    color: "from-yellow-400 to-orange-400",  say: "มาป๊อปฟองสบู่กัน! ฝึกสมาธิด้วยนะ 🫧" },
  { game: "opposite",       emoji: "🔄", label: "คำตรงข้าม",       color: "from-indigo-400 to-purple-500",  say: "มาหาคำตรงข้ามกัน! น้องจะเก่งภาษาขึ้นเลย 🔄" },
  { game: "dialogue",       emoji: "💬", label: "บทสนทนา",         color: "from-sky-400 to-blue-500",       say: "มาฝึกพูดคุยกัน! น้องจะรู้ว่าพูดอะไรดีในแต่ละสถานการณ์ 💬" },
  { game: "needs",          emoji: "🙋", label: "บอกความต้องการ",  color: "from-emerald-400 to-teal-500",   say: "มาฝึกบอกสิ่งที่น้องต้องการกัน! พูดออกมาได้เลยนะ 🙋" },
  { game: "odd-one-out",    emoji: "🔍", label: "หาตัวแปลก",       color: "from-amber-400 to-orange-500",   say: "มาหาตัวที่ไม่เข้าพวกกัน! ใช้สายตาดีๆ นะ 🔍" },
  { game: "rhythm",         emoji: "🥁", label: "จับจังหวะสี",    color: "from-violet-400 to-purple-500",  say: "มาจำสีและกดตามลำดับกัน! ฝึกความจำด้วยนะ 🥁" },
  { game: "word-category",  emoji: "🏷️", label: "เลือกหมวดคำ",   color: "from-lime-400 to-green-500",     say: "มาเลือกหมวดหมู่ของคำกัน! น้องรู้จักคำเยอะมากไหมนะ 🏷️" },
  { game: "color",          emoji: "🎨", label: "เกมทายสี",        color: "from-pink-400 to-orange-400",    say: "มาทายสีกัน! น้องรู้จักสีอะไรบ้างนะ? 🎨" },
] as const;
type GameId = typeof GAME_ITEMS[number]["game"];

type KidoGameNextHint = { emoji: string; label: string; color: string };
type KidoGameProps   = { onBack: () => void; onComplete: (result?: GameResult) => void; nextGame?: KidoGameNextHint };
const GAME_MAP: Record<GameId, (props: KidoGameProps) => React.ReactElement> = {
  "matching":       (p) => <MemoryMatchGame {...p} />,
  "picture-quiz":   (p) => <PictureQuizGame {...p} />,
  "flashcard":      (p) => <FlashcardGame {...p} />,
  "counting":       (p) => <CountingGame {...p} />,
  "sorting":        (p) => <SortingGame {...p} />,
  "quiz-fruits":    (p) => <PictureQuizGame {...p} category="fruits" />,
  "quiz-pets":      (p) => <PictureQuizGame {...p} category="pets" />,
  "quiz-household": (p) => <PictureQuizGame {...p} category="household" />,
  "quiz-school":    (p) => <PictureQuizGame {...p} category="school" />,
  "quiz-personal":  (p) => <PictureQuizGame {...p} category="personal" />,
  "emotion":        (p) => <EmotionGame      onBack={p.onBack} onComplete={p.onComplete} />,
  "shapes":         (p) => <ShapesGame       onBack={p.onBack} onComplete={p.onComplete} />,
  "sequence":       (p) => <SequenceGame     onBack={p.onBack} onComplete={p.onComplete} />,
  "bubble-pop":     (p) => <BubblePopGame    onBack={p.onBack} onComplete={p.onComplete} />,
  "opposite":       (p) => <OppositeGame     onBack={p.onBack} onComplete={p.onComplete} />,
  "dialogue":       (p) => <DialogueGame     onBack={p.onBack} onComplete={p.onComplete} />,
  "needs":          (p) => <NeedsGame        onBack={p.onBack} onComplete={p.onComplete} />,
  "odd-one-out":    (p) => <OddOneOutGame    onBack={p.onBack} onComplete={p.onComplete} />,
  "rhythm":         (p) => <RhythmGame       onBack={p.onBack} onComplete={p.onComplete} />,
  "word-category":  (p) => <WordCategoryGame onBack={p.onBack} onComplete={p.onComplete} />,
  "color":          (p) => <ColorGame        onBack={p.onBack} onComplete={p.onComplete} />,
};

/* ─── stats + sessions + recommendation (localStorage) ─── */
const STATS_KEY    = "kidocoachai-stats";
const SESSIONS_KEY = "kidocoachai-sessions";
const REC_KEY      = "kidocoachai-rec";
type GameStat = { plays: number; lastPlayed: string };
type StatsMap = Record<string, GameStat>;
type RecCache = { order: GameId[]; highlight: GameId; reason: string; cachedAt: number };

const GAME_COUNT = 21; // bump this whenever GAME_ITEMS grows to auto-bust old caches

function loadRecCache(): RecCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REC_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as RecCache;
    if (Date.now() - data.cachedAt > 24 * 60 * 60 * 1000) return null;
    // Invalidate if cache was built before new games were added
    if (data.order.length < GAME_COUNT) return null;
    return data;
  } catch { return null; }
}
function clearRecCache() {
  if (typeof window !== "undefined") localStorage.removeItem(REC_KEY);
}


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
  const { childProfile, childAge, isLoaded, kidoSettings, saveGameSession } = useProfile();

  const [emotion, setEmotion]       = useState<KidoEmotion>("idle");
  const [displayed, setDisplayed]   = useState("");
  const [phase, setPhase]           = useState<Phase>("greeting");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [stats, setStats]           = useState<StatsMap>({});
  const [showStats, setShowStats]   = useState(false);
  const [insights, setInsights]     = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [recOrder, setRecOrder]     = useState<GameId[]>(GAME_ITEMS.map((g) => g.game));
  const [recHighlight, setRecHighlight] = useState<GameId | null>(null);
  const [recReason, setRecReason]   = useState("");
  const [showBreak, setShowBreak]   = useState<"activity" | "limit" | null>(null);
  const [showMission, setShowMission] = useState<Mission | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [resumeCount, setResumeCount] = useState(0);
  const [nextGameHint, setNextGameHint] = useState<typeof GAME_ITEMS[number] | null>(null);

  const synthRef     = useRef<SpeechSynthesis | null>(null);
  const typeTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef     = useRef<any>(null);
  const sessionStart  = useRef(0);
  const warned15      = useRef(false);
  const missionShown  = useRef(false);
  const playTimer     = useRef<ReturnType<typeof setInterval> | null>(null);

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

  /* ── sync screen-time to server on page unload (beacon = fire-and-forget) ── */
  useEffect(() => {
    const handler = () => beaconDailyData();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  /* ── game recommendation (AI or rule-based, cached 24h) ── */
  useEffect(() => {
    if (!childProfile) return;
    const cached = loadRecCache();
    if (cached) {
      setRecOrder(cached.order);
      setRecHighlight(cached.highlight);
      setRecReason(cached.reason);
      return;
    }
    // fetch in background — never blocks UI
    const sessions: GameSession[] = (() => {
      try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]"); }
      catch { return []; }
    })();
    const ageMonths = childProfile.birthdate ? (() => {
      const b = new Date(childProfile.birthdate);
      const n = new Date();
      return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    })() : 0;
    fetch("/api/kido-game-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childName: childProfile.name,
        childAge,
        diagnosisLabel: childProfile.diagnosisLabel,
        diagnosisKey: childProfile.diagnosisKey,
        ageMonths,
        recentSessions: sessions.slice(0, 5),
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { order: GameId[]; highlight: GameId; reason: string } | null) => {
        if (!data || !data.order?.length) return;
        const cache: RecCache = { ...data, cachedAt: Date.now() };
        localStorage.setItem(REC_KEY, JSON.stringify(cache));
        setRecOrder(data.order);
        setRecHighlight(data.highlight);
        setRecReason(data.reason);
      })
      .catch(() => { /* keep default order */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childProfile]);

  /* ── play-time guard (3 levels) ── */
  useEffect(() => {
    if (!isLoaded) return;
    const limitMinutes = kidoSettings.dailyLimitMinutes;
    const daily = loadDailyData();
    const current = daily.screenMinutes;
    setDailyMinutes(current);

    // already hit daily limit
    if (limitMinutes > 0 && current >= limitMinutes) {
      setShowBreak("limit");
      return;
    }

    sessionStart.current = Date.now();
    warned15.current     = false;
    missionShown.current = false;
    if (playTimer.current) clearInterval(playTimer.current);

    playTimer.current = setInterval(() => {
      const updated = addScreenMinute();
      setDailyMinutes(updated.screenMinutes);
      if (updated.screenMinutes % 5 === 0) syncDailyData(updated);
      const lim = kidoSettings.dailyLimitMinutes;
      if (lim > 0 && updated.screenMinutes >= lim) {
        speak("หยุดพักก่อนนะ! ไปเล่นของเล่นจริงๆ หรืออ่านนิทานกับคุณพ่อคุณแม่นะ 😊", "talking");
        setShowBreak("limit");
        clearInterval(playTimer.current!);
        return;
      }
      const elapsed = Math.floor((Date.now() - sessionStart.current) / 60000);
      // Level 1 – Gentle Reminder at 15 min
      if (elapsed >= 15 && !warned15.current) {
        warned15.current = true;
        speak("เล่นมา 15 นาทีแล้วนะ ลุกขึ้นยืดเส้นยืดสายสักหน่อยนะ แล้วกลับมาเล่นต่อได้เลย 😊", "talking");
      }
      // Level 2 – Offline Mission at 20 min
      if (elapsed >= 20 && !missionShown.current) {
        missionShown.current = true;
        const d = loadDailyData();
        setShowMission(randomMission(d.completedMissions));
      }
      // Level 3 – Mandatory Activity Break at 30 min
      if (elapsed >= 30) {
        setShowBreak("activity");
        clearInterval(playTimer.current!);
      }
    }, 60000);

    return () => { if (playTimer.current) clearInterval(playTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, kidoSettings.dailyLimitMinutes, resumeCount]);

  function handleResumeAfterBreak() {
    setShowBreak(null);
    setResumeCount((c) => c + 1);
  }

  /* ── pre-compute next game whenever active game changes ── */
  useEffect(() => {
    if (!activeGame) { setNextGameHint(null); return; }
    const others = GAME_ITEMS.filter((g) => g.game !== activeGame);
    setNextGameHint(others[Math.floor(Math.random() * others.length)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame]);

  /* ── game handlers ── */
  function handleGameSelect(item: typeof GAME_ITEMS[number]) {
    speak(item.say, "talking", () => setActiveGame(item.game));
  }

  function handleGameBack() {
    setActiveGame(null);
    speak("กลับมาดีจัง! เลือกเกมใหม่ได้เลย!", "talking", () => setPhase("menu"));
    setPhase("menu");
  }

  function handleGameComplete(result?: GameResult) {
    const finished = activeGame!;
    const finishedInfo = GAME_ITEMS.find((g) => g.game === finished)!;
    setStats((prev) => recordPlay(finished, prev));
    clearRecCache();

    // persist session — บันทึกทั้ง localStorage (สำหรับ AI rec) และ Clerk (สำหรับ dashboard)
    if (result && typeof window !== "undefined") {
      const session: GameSession = {
        gameId: finished,
        gameName: finishedInfo.label,
        date: new Date().toISOString().slice(0, 10),
        score: result.score,
        total: result.total,
        accuracy: Math.round((result.score / Math.max(result.total, 1)) * 100),
        ts: Date.now(),
      };
      // 1) localStorage — ใช้โดย AI recommendation ใน kido page
      try {
        const prev: GameSession[] = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]");
        localStorage.setItem(SESSIONS_KEY, JSON.stringify([session, ...prev].slice(0, 50)));
      } catch { /* ignore */ }
      // 2) Clerk unsafeMetadata — ใช้โดย dashboard + behavioral filter
      saveGameSession(session).catch(console.error);
    }

    // Go directly to next game — use the pre-computed hint so it matches what was shown
    const others = GAME_ITEMS.filter((g) => g.game !== finished);
    const next = nextGameHint ?? others[Math.floor(Math.random() * others.length)];
    const accuracy = result ? Math.round((result.score / Math.max(result.total, 1)) * 100) : 0;
    const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    speak(`${praise} ${accuracy >= 80 ? "เจ๋งสุดๆ! " : ""}ต่อไปลองเล่น${next.label}กันเลยนะ!`, "celebrating", () => {
      setActiveGame(next.game);
    });
  }

  async function fetchInsights() {
    setLoadingInsights(true);
    setInsights("");
    try {
      const sessions: GameSession[] = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]");
      if (sessions.length === 0) {
        setInsights("ยังไม่มีข้อมูลเพียงพอ เล่นเกมสัก 3 รอบก่อนนะ 🎮");
        return;
      }
      const res = await fetch("/api/kido-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: sessions.slice(0, 20), childName: childProfile?.name }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setInsights(err.error ?? "ขอโทษนะ ลองใหม่ภายหลัง");
        return;
      }
      const data = await res.json() as { insights: string };
      setInsights(data.insights);
    } catch {
      setInsights("เกิดข้อผิดพลาด ลองใหม่นะ 😅");
    } finally {
      setLoadingInsights(false);
    }
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
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          speak(res.status === 429
            ? "วันนี้คุยได้แค่นี้แล้วนะ พรุ่งนี้ค่อยคุยกันอีกนะ!"
            : (err.error ?? "ขอโทษนะ ลองใหม่ภายหลัง!"),
            "idle", () => setPhase("menu"));
          return;
        }
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
    const renderGame = GAME_MAP[activeGame];
    const gameInfo = GAME_ITEMS.find((g) => g.game === activeGame)!;
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50">
        {showMission && (
          <KidoMissionOverlay
            mission={showMission}
            onComplete={() => setShowMission(null)}
            onSkip={() => setShowMission(null)}
          />
        )}
        {showBreak && (
          <KidoBreakOverlay
            type={showBreak}
            dailyMinutes={dailyMinutes}
            limitMinutes={kidoSettings.dailyLimitMinutes}
            onResume={handleResumeAfterBreak}
          />
        )}
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
          {renderGame({
            onBack: handleGameBack,
            onComplete: handleGameComplete,
            nextGame: nextGameHint ?? undefined,
          })}
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
          <img src={KIDO_IMG[emotion]} alt="Kido" className="w-48 h-48 sm:w-56 sm:h-56"
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
            {recReason ? (
              <p className="text-amber-300/90 text-xs text-center mb-1.5 font-medium">✨ {recReason}</p>
            ) : (
              <p className="text-white/60 text-xs text-center mb-1.5 font-medium">เลือกกิจกรรม</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {recOrder
                .map((id) => GAME_ITEMS.find((g) => g.game === id)!)
                .filter(Boolean)
                .slice(0, 6)
                .map((item) => {
                  const s = stats[item.game];
                  const isHighlight = item.game === recHighlight;
                  return (
                    <button key={item.game} onClick={() => handleGameSelect(item)}
                      className={`bg-gradient-to-br ${item.color} rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-lg active:scale-95 transition-transform relative ${isHighlight ? "ring-2 ring-white/70 mt-3" : ""}`}>
                      {isHighlight && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-[9px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap shadow">
                          ⭐ แนะนำ
                        </span>
                      )}
                      {s && !isHighlight && (
                        <span className="absolute top-1 right-1 bg-black/30 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                          {s.plays}ครั้ง
                        </span>
                      )}
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-white font-bold text-xs text-center leading-tight">{item.label}</span>
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

      {/* Offline mission overlay */}
      {showMission && (
        <KidoMissionOverlay
          mission={showMission}
          onComplete={() => setShowMission(null)}
          onSkip={() => setShowMission(null)}
        />
      )}

      {/* Break / daily-limit overlay */}
      {showBreak && (
        <KidoBreakOverlay
          type={showBreak}
          dailyMinutes={dailyMinutes}
          limitMinutes={kidoSettings.dailyLimitMinutes}
          onResume={handleResumeAfterBreak}
        />
      )}

      {/* Stats modal */}
      {showStats && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4" onClick={() => setShowStats(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

            {/* AI Coaching Insights */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <button
                onClick={fetchInsights}
                disabled={loadingInsights}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl py-3 text-sm font-bold disabled:opacity-60"
              >
                <Brain className="w-4 h-4" />
                {loadingInsights ? "AI กำลังวิเคราะห์..." : "🧠 AI วิเคราะห์พัฒนาการ"}
              </button>
              {insights && (
                <div className="mt-3 bg-violet-50 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {insights}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
