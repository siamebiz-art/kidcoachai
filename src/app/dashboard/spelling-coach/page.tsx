"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, Volume2, CheckCircle2, XCircle, RefreshCw, Loader2, Trophy } from "lucide-react";
import toast from "react-hot-toast";

const LEVELS = ["p1","p2","p3","p4","p5","p6"] as const;
const LEVEL_LABELS: Record<string, string> = { p1:"ป.1", p2:"ป.2", p3:"ป.3", p4:"ป.4", p5:"ป.5", p6:"ป.6" };

interface WordResult { word: string; answer: string; correct: boolean }

export default function SpellingCoachPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const defaultLevel = childAge ? `p${Math.max(1, Math.min(6, Math.round(parseInt(childAge) - 5)))}` : "p3";

  const [lang, setLang] = useState<"th" | "en">("th");
  const [level, setLevel] = useState(defaultLevel);
  const [words, setWords] = useState<string[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [phase, setPhase] = useState<"setup" | "quiz" | "done">("setup");
  const [speaking, setSpeaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === "quiz") inputRef.current?.focus();
  }, [phase, current]);

  async function loadWords() {
    setLoadingWords(true);
    try {
      const res = await fetch("/api/kido-spelling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, language: lang }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const data = (await res.json()) as { words: string[] };
      setWords(data.words);
      setCurrent(0);
      setResults([]);
      setInput("");
      setPhase("quiz");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoadingWords(false);
    }
  }

  function speakWord(word: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(true);
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = lang === "th" ? "th-TH" : "en-US";
    utt.rate = 0.8;
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  function submitAnswer() {
    if (!input.trim()) return;
    const currentWord = words[current];
    const correct = input.trim().toLowerCase() === currentWord.toLowerCase();
    const newResults = [...results, { word: currentWord, answer: input.trim(), correct }];
    setResults(newResults);
    setInput("");

    if (current + 1 >= words.length) {
      setPhase("done");
    } else {
      setCurrent(current + 1);
      setTimeout(() => {
        speakWord(words[current + 1]);
        inputRef.current?.focus();
      }, 300);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitAnswer();
  }

  function restart() {
    setPhase("setup");
    setWords([]);
    setResults([]);
    setCurrent(0);
    setInput("");
  }

  const score = results.filter((r) => r.correct).length;
  const pct = results.length > 0 ? Math.round((score / results.length) * 100) : 0;

  /* ── Done screen ── */
  if (phase === "done") {
    const medal = pct === 100 ? "🏆" : pct >= 70 ? "🥇" : pct >= 50 ? "🥈" : "🎯";
    const msg   = pct === 100 ? "Perfect! สะกดถูกทุกคำ!" : pct >= 70 ? "เก่งมาก! เกือบสมบูรณ์แล้ว" : pct >= 50 ? "ดีนะ! ฝึกต่อไปนะ" : "อย่าท้อ! ลองฝึกอีกครั้ง";
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pt-2">
            <Link href="/dashboard">
              <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <h1 className="font-black text-xl text-gray-900">🔤 Spelling Coach</h1>
          </div>

          <div className="bg-white rounded-3xl border border-purple-100 shadow-md p-6 mb-4 text-center">
            <div className="text-6xl mb-3">{medal}</div>
            <p className="text-4xl font-black text-purple-600 mb-1">{score}/{results.length}</p>
            <p className="text-sm text-gray-500 mb-2">{pct}% ถูกต้อง</p>
            <p className="font-bold text-gray-700">{msg}</p>
            <p className="text-sm text-gray-500 mt-1">เก่งมากเลย {childName}! 🌟</p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4 space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-2xl px-4 py-2.5 ${r.correct ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex items-center gap-2">
                  {r.correct ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="font-bold text-sm text-gray-800">{r.word}</span>
                </div>
                {!r.correct && (
                  <span className="text-xs text-red-400">คุณพิมพ์: {r.answer}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadWords}
              disabled={loadingWords}
              className="flex-1 py-3 rounded-2xl bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> คำใหม่
            </button>
            <button
              onClick={restart}
              className="flex-1 py-3 rounded-2xl bg-white border-2 border-purple-200 text-purple-700 font-bold text-sm hover:bg-purple-50 transition-colors"
            >
              เปลี่ยนระดับ
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Quiz screen ── */
  if (phase === "quiz") {
    const currentWord = words[current];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pt-2">
            <Link href="/dashboard">
              <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="font-black text-xl text-gray-900">🔤 Spelling Coach</h1>
              <p className="text-sm text-gray-500">{lang === "th" ? "ภาษาไทย" : "English"} · {LEVEL_LABELS[level]}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 transition-all rounded-full"
                style={{ width: `${((current) / words.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500">{current + 1}/{words.length}</span>
          </div>

          {/* Word card */}
          <div className="bg-white rounded-3xl border border-purple-100 shadow-md p-8 mb-4 text-center">
            <p className="text-xs text-gray-400 mb-4">กด Speaker เพื่อฟังคำแล้วพิมพ์สะกด</p>
            <button
              onClick={() => speakWord(currentWord)}
              disabled={speaking}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg transition-all mb-4 ${
                speaking ? "bg-purple-200 animate-pulse" : "bg-gradient-to-br from-purple-400 to-pink-400 hover:scale-105 active:scale-95"
              }`}
            >
              <Volume2 className="w-9 h-9 text-white" />
            </button>
            <p className="text-sm text-gray-500">
              {speaking ? "กำลังพูด..." : "แตะเพื่อฟัง"}
            </p>
          </div>

          {/* Input */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">พิมพ์คำที่ได้ยิน</p>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={lang === "th" ? "พิมพ์ภาษาไทย..." : "Type the word..."}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-purple-300 focus:outline-none text-lg font-bold text-center text-gray-800 bg-gray-50"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <button
            onClick={submitAnswer}
            disabled={!input.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-40"
          >
            ตรวจคำ ✓
          </button>

          {/* Mini results so far */}
          {results.length > 0 && (
            <div className="mt-4 flex gap-1.5 flex-wrap">
              {results.map((r, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${r.correct ? "bg-green-400" : "bg-red-400"}`}
                >
                  {r.correct ? "✓" : "✗"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Setup screen ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🔤 Spelling Coach</h1>
            <p className="text-sm text-gray-500">ฝึกสะกดคำกับ Kido</p>
          </div>
        </div>

        {/* Kido prompt */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm">
              สวัสดี {childName}! 🔤 วันนี้เราจะฝึกสะกดคำด้วยกัน<br />
              เลือกภาษาและระดับชั้น แล้วกดเริ่มเลย!
            </p>
          </div>
        </div>

        {/* Language */}
        <div className="flex gap-2 mb-4">
          {(["th","en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                lang === l ? "bg-purple-500 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l === "th" ? "🇹🇭 ภาษาไทย" : "🇺🇸 English"}
            </button>
          ))}
        </div>

        {/* Level */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-5">
          <p className="text-xs font-bold text-gray-500 mb-3">ระดับชั้น</p>
          <div className="grid grid-cols-6 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`py-2 rounded-xl font-bold text-sm transition-all ${
                  level === l ? "bg-purple-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-purple-50"
                }`}
              >
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-purple-50 rounded-3xl p-4 mb-5 border border-purple-100">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-400" />
            <div>
              <p className="font-bold text-purple-800 text-sm">รูปแบบการฝึก</p>
              <p className="text-xs text-purple-600">ฟังเสียงคำ → พิมพ์สะกด → รู้ผลทันที · 10 คำต่อรอบ</p>
            </div>
          </div>
        </div>

        <button
          onClick={loadWords}
          disabled={loadingWords}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loadingWords ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดคำศัพท์...</>
          ) : (
            <>🔤 เริ่มฝึกสะกดคำ</>
          )}
        </button>

      </div>
    </div>
  );
}
