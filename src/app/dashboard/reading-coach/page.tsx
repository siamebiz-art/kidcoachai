"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, BookOpen, Mic, MicOff, Volume2, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const LEVELS = ["p1","p2","p3","p4","p5","p6"] as const;
const LEVEL_LABELS: Record<string, string> = { p1:"ป.1", p2:"ป.2", p3:"ป.3", p4:"ป.4", p5:"ป.5", p6:"ป.6" };

const TOPICS = {
  th: [
    { id: "animals", label: "สัตว์", emoji: "🐘" },
    { id: "nature",  label: "ธรรมชาติ", emoji: "🌿" },
    { id: "family",  label: "ครอบครัว", emoji: "🏠" },
    { id: "school",  label: "โรงเรียน", emoji: "📚" },
    { id: "food",    label: "อาหาร", emoji: "🍜" },
    { id: "friends", label: "เพื่อน", emoji: "🤝" },
  ],
  en: [
    { id: "animals", label: "Animals", emoji: "🐘" },
    { id: "nature",  label: "Nature",  emoji: "🌿" },
    { id: "family",  label: "Family",  emoji: "🏠" },
    { id: "school",  label: "School",  emoji: "📚" },
    { id: "food",    label: "Food",    emoji: "🍎" },
    { id: "friends", label: "Friends", emoji: "🤝" },
  ],
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function scoreAccuracy(original: string, spoken: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^฀-๿a-z0-9\s]/g, "").trim();
  const origWords  = normalize(original).split(/\s+/).filter(Boolean);
  const spokenWords = normalize(spoken).split(/\s+/).filter(Boolean);
  if (origWords.length === 0) return 0;
  let matched = 0;
  for (const w of spokenWords) {
    if (origWords.includes(w)) matched++;
  }
  return Math.round((matched / origWords.length) * 100);
}

export default function ReadingCoachPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const defaultLevel = childAge ? `p${Math.max(1, Math.min(6, Math.round(parseInt(childAge) - 5)))}` : "p3";

  const [lang, setLang] = useState<"th" | "en">("th");
  const [level, setLevel] = useState(defaultLevel);
  const [topic, setTopic] = useState("animals");
  const [passage, setPassage] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => { recogRef.current?.stop(); };
  }, []);

  async function generatePassage() {
    if (loading) return;
    setPassage("");
    setTranscript("");
    setAccuracy(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kido-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, language: lang, topic, childName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setPassage(full);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  function speakPassage() {
    if (!passage || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(passage);
    utt.lang = lang === "th" ? "th-TH" : "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }

  function startListening() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { toast.error("เบราว์เซอร์ไม่รองรับการฟังเสียง"); return; }
    const recog = new SR();
    recog.lang = lang === "th" ? "th-TH" : "en-US";
    recog.continuous = true;
    recog.interimResults = true;
    let finalText = "";
    recog.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < Object.keys(e.results).length; i++) {
        const r = e.results[i];
        if (r[0]) {
          interim += r[0].transcript;
        }
      }
      finalText = interim;
      setTranscript(interim);
    };
    recog.onend = () => {
      setListening(false);
      if (finalText && passage) {
        const score = scoreAccuracy(passage, finalText);
        setAccuracy(score);
      }
    };
    recog.start();
    recogRef.current = recog;
    setListening(true);
    setTranscript("");
    setAccuracy(null);
  }

  function stopListening() {
    recogRef.current?.stop();
    setListening(false);
  }

  const scoreColor = accuracy === null ? "" : accuracy >= 80 ? "text-green-600" : accuracy >= 50 ? "text-yellow-600" : "text-red-500";
  const scoreBg    = accuracy === null ? "" : accuracy >= 80 ? "bg-green-50 border-green-200" : accuracy >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
  const scoreMsg   = accuracy === null ? "" : accuracy >= 80 ? "เยี่ยมมาก! Kido ภูมิใจมาก 🌟" : accuracy >= 50 ? "ดีนะ! ลองอ่านอีกครั้งนะ 💪" : "ลองอ่านช้าๆ แล้วลองใหม่นะ 🤗";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">📖 Reading Coach</h1>
            <p className="text-sm text-gray-500">ฝึกอ่านออกเสียงกับ Kido</p>
          </div>
        </div>

        {/* Language toggle */}
        <div className="flex gap-2 mb-4">
          {(["th","en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setPassage(""); setTranscript(""); setAccuracy(null); }}
              className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                lang === l ? "bg-blue-500 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l === "th" ? "🇹🇭 ภาษาไทย" : "🇺🇸 English"}
            </button>
          ))}
        </div>

        {/* Level picker */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">ระดับชั้น</p>
          <div className="grid grid-cols-6 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => { setLevel(l); setPassage(""); setTranscript(""); setAccuracy(null); }}
                className={`py-2 rounded-xl font-bold text-sm transition-all ${
                  level === l ? "bg-blue-500 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-blue-50"
                }`}
              >
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Topic pills */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">หัวข้อ</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS[lang].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTopic(t.id); setPassage(""); setTranscript(""); setAccuracy(null); }}
                className={`px-3 py-2 rounded-2xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  topic === t.id ? "bg-blue-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-blue-50 border border-gray-100"
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generatePassage}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-base shadow-lg hover:shadow-xl active:scale-95 transition-all mb-4 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> กำลังสร้างบทอ่าน...</>
          ) : (
            <><BookOpen className="w-5 h-5" /> สร้างบทอ่าน</>
          )}
        </button>

        {/* Passage display */}
        {passage && (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-md p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-blue-600">📄 บทอ่าน</p>
              <div className="flex gap-2">
                <button
                  onClick={speakPassage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" /> ฟัง
                </button>
                <button
                  onClick={generatePassage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> ใหม่
                </button>
              </div>
            </div>
            <p className="text-gray-800 text-sm leading-loose whitespace-pre-wrap">{passage}</p>
          </div>
        )}

        {/* Record reading */}
        {passage && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <p className="text-xs font-bold text-gray-500 mb-3">🎤 อ่านออกเสียงแล้วกด Record</p>
            <button
              onClick={listening ? stopListening : startListening}
              className={`w-full py-3.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                listening
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                  : "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl active:scale-95"
              }`}
            >
              {listening ? (
                <><MicOff className="w-5 h-5" /> หยุดบันทึก</>
              ) : (
                <><Mic className="w-5 h-5" /> เริ่มอ่านออกเสียง</>
              )}
            </button>
            {listening && (
              <p className="text-center text-xs text-gray-500 mt-2 animate-pulse">กำลังฟัง... อ่านออกเสียงได้เลย</p>
            )}
            {transcript && !listening && (
              <div className="mt-3 p-3 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 mb-1">ที่ได้ยิน:</p>
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* Score */}
        {accuracy !== null && (
          <div className={`rounded-3xl border p-5 mb-4 ${scoreBg}`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-8 h-8 ${scoreColor}`} />
              <div>
                <p className={`text-3xl font-black ${scoreColor}`}>{accuracy}%</p>
                <p className="text-sm text-gray-600">{scoreMsg}</p>
              </div>
            </div>
            {accuracy < 80 && (
              <button
                onClick={() => { speakPassage(); setTranscript(""); setAccuracy(null); }}
                className="mt-3 w-full py-2 rounded-xl bg-white border text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" /> ฟังแบบอย่างก่อนลองใหม่
              </button>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100">
          <p className="text-xs font-bold text-blue-700 mb-3">💡 เคล็ดลับการอ่าน</p>
          <div className="space-y-2">
            {[
              { e: "👁️", t: "อ่านคำทั้งหมดก่อน แล้วค่อยออกเสียง" },
              { e: "🐢", t: "อ่านช้าๆ ชัดๆ ดีกว่าเร็วแต่ไม่ชัด" },
              { e: "🔁", t: "ฟังแบบอย่างก่อน แล้วพยายามอ่านตาม" },
              { e: "⭐", t: "ลองอ่าน 3 รอบ แต่ละรอบจะดีขึ้น!" },
            ].map((t) => (
              <div key={t.e} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-blue-50">
                <span className="text-base">{t.e}</span>
                <span className="text-xs text-gray-600">{t.t}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
