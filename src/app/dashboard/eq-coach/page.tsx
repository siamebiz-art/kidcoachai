"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const EMOTIONS = [
  { id: "ดีใจ",    emoji: "😊", label: "ดีใจ",    color: "from-yellow-400 to-amber-400",  bg: "bg-yellow-50",  border: "border-yellow-300",  ring: "ring-yellow-300" },
  { id: "เศร้า",   emoji: "😢", label: "เศร้า",   color: "from-blue-400 to-indigo-400",   bg: "bg-blue-50",    border: "border-blue-300",    ring: "ring-blue-300"   },
  { id: "โกรธ",   emoji: "😠", label: "โกรธ",   color: "from-red-400 to-rose-500",      bg: "bg-red-50",     border: "border-red-300",     ring: "ring-red-300"    },
  { id: "เหนื่อย", emoji: "😴", label: "เหนื่อย", color: "from-gray-400 to-slate-500",   bg: "bg-gray-50",    border: "border-gray-300",    ring: "ring-gray-300"   },
  { id: "กังวล",   emoji: "😰", label: "กังวล",   color: "from-purple-400 to-violet-500", bg: "bg-purple-50",  border: "border-purple-300",  ring: "ring-purple-300" },
] as const;

type EmotionId = (typeof EMOTIONS)[number]["id"];

const KIDO_STARTERS = [
  "วันนี้หนูรู้สึกยังไงบ้าง? Kido อยากฟัง! 🌈",
  "มาบอก Kido หน่อยนะ วันนี้ใจหนูรู้สึกอะไรอยู่? 💛",
  "กดเลือกอารมณ์ที่หนูรู้สึกอยู่ตอนนี้เลยนะ! ❤️",
];

export default function EQCoachPage() {
  const { childProfile, childAge } = useProfile();
  const [selected, setSelected] = useState<EmotionId | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const ageYears = childAge ? parseInt(childAge) || 5 : 5;
  const childName = childProfile?.name ?? "น้อง";
  const starterMsg = KIDO_STARTERS[historyCount % KIDO_STARTERS.length];

  async function handleSelect(emoId: EmotionId) {
    if (loading) return;
    setSelected(emoId);
    setResponse(null);
    setLoading(true);

    try {
      const res = await fetch("/api/kido-eq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, emotion: emoId, ageYears }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const data = (await res.json()) as { response: string };
      setResponse(data.response);
      setHistoryCount((n) => n + 1);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSelected(null);
    setResponse(null);
  }

  const emo = EMOTIONS.find((e) => e.id === selected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">💛 Kido EQ Coach</h1>
            <p className="text-sm text-gray-500">ฝึกเข้าใจอารมณ์กับ Kido</p>
          </div>
        </div>

        {/* Kido prompt */}
        <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm p-4 mb-6 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-yellow-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm">
              สวัสดี{childName}! 👋 {starterMsg}
            </p>
          </div>
        </div>

        {/* Emotion grid */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {EMOTIONS.map((emo) => (
            <button
              key={emo.id}
              onClick={() => handleSelect(emo.id)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                selected === emo.id
                  ? `${emo.bg} ${emo.border} shadow-md ring-2 ${emo.ring} ring-offset-1 scale-105`
                  : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              } ${loading ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
            >
              <span className="text-3xl">{emo.emoji}</span>
              <span className="text-[10px] font-bold text-gray-700">{emo.label}</span>
            </button>
          ))}
        </div>

        {/* Kido response */}
        {(loading || response) && (
          <div className="bg-white rounded-3xl border border-purple-100 shadow-md p-5 mb-4">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 flex-1 ${emo ? emo.bg : "bg-purple-50"}`}>
                {loading ? (
                  <div className="flex items-center gap-2 text-purple-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Kido กำลังคิด...</span>
                  </div>
                ) : (
                  <p className="text-gray-800 text-sm leading-relaxed">{response}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reset */}
        {response && (
          <button
            onClick={reset}
            className="w-full py-3 rounded-2xl bg-white border-2 border-purple-100 text-purple-700 font-bold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> บอก Kido อีกครั้ง
          </button>
        )}

        {/* Tips footer */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-100">
          <p className="text-xs font-bold text-purple-700 mb-3">💡 Kido Tips: รู้จักอารมณ์ตัวเอง</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: "😊", tip: "ดีใจ = เล่าให้ทุกคนฟัง" },
              { emoji: "😢", tip: "เศร้า = ขอกอดได้เลย" },
              { emoji: "😠", tip: "โกรธ = หายใจลึกๆ ก่อน" },
              { emoji: "😰", tip: "กังวล = บอกคุณพ่อแม่" },
            ].map((t) => (
              <div key={t.emoji} className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-purple-100">
                <span className="text-lg">{t.emoji}</span>
                <span className="text-[10px] text-gray-600 font-medium">{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
