"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, Loader2, RefreshCcw, Volume2 } from "lucide-react";
import toast from "react-hot-toast";

const STORY_TYPES = [
  { id: "bedtime",     emoji: "🌙", title: "นิทานก่อนนอน",   desc: "ผ่อนคลายและนอนหลับดี",     color: "from-indigo-400 to-purple-500" },
  { id: "eq",          emoji: "💛", title: "ฝึก EQ",           desc: "เข้าใจความรู้สึกตัวเอง",  color: "from-yellow-400 to-amber-500"  },
  { id: "manners",     emoji: "🤝", title: "มารยาทดี",         desc: "เป็นคนดีมีน้ำใจ",          color: "from-green-400 to-emerald-500" },
  { id: "discipline",  emoji: "⭐", title: "ฝึกวินัย",         desc: "รับผิดชอบและตั้งใจ",       color: "from-blue-400 to-cyan-500"     },
  { id: "inspiration", emoji: "🚀", title: "แรงบันดาลใจ",     desc: "ฝันใหญ่และกล้าลองใหม่",    color: "from-pink-400 to-rose-500"     },
];

export default function StoryPage() {
  const { childProfile, childAge } = useProfile();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [story, setStory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<(typeof STORY_TYPES)[0] | null>(null);

  const ageYears = childAge ? parseInt(childAge) || 5 : 5;
  const childName = childProfile?.name ?? "น้อง";

  async function generateStory(typeId: string) {
    const type = STORY_TYPES.find((t) => t.id === typeId);
    if (!type) return;
    setLoading(true);
    setStory("");
    setSelectedType(typeId);
    setActiveType(type);

    try {
      const res = await fetch("/api/kido-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, storyType: typeId, ageYears }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }
      // Read plain text stream from toTextStreamResponse()
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStory((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  function readAloud() {
    if (!story || typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(story);
    utter.lang = "th-TH";
    utter.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">📖 Kido Story Time</h1>
            <p className="text-sm text-gray-500">นิทาน AI สำหรับ{childName} ✨</p>
          </div>
        </div>

        {/* Kido intro card */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-4 mb-6 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm">
              สวัสดี{childName}! 📖 Kido มีนิทานพิเศษมาเล่าให้ฟังนะ
            </p>
            <p className="text-gray-400 text-xs mt-1">เลือกประเภทนิทานที่อยากฟังได้เลย</p>
          </div>
        </div>

        {/* Story type buttons */}
        <div className="space-y-3 mb-6">
          {STORY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => generateStory(type.id)}
              disabled={loading}
              className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${
                selectedType === type.id
                  ? "border-purple-400 bg-purple-50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/30"
              } ${loading ? "opacity-60 cursor-not-allowed" : "active:scale-[0.98]"}`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-2xl">{type.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">{type.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{type.desc}</div>
              </div>
              {selectedType === type.id && loading && (
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Story display */}
        {(loading || story) && (
          <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
            <div className={`bg-gradient-to-r ${activeType?.color ?? "from-indigo-500 to-purple-600"} px-5 py-3.5 flex items-center gap-3`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-point.png" alt="Kido" className="w-9 h-9 object-contain shrink-0" />
              <div className="flex-1">
                <div className="text-white font-black text-sm">{activeType?.title ?? "นิทาน"}</div>
                <div className="text-white/60 text-[10px]">เรื่องราวของ{childName} 🌟</div>
              </div>
              <div className="flex items-center gap-2">
                {!loading && story && (
                  <>
                    <button
                      onClick={readAloud}
                      className="bg-white/20 text-white text-[10px] font-bold p-2 rounded-full hover:bg-white/30 transition-colors"
                      title="อ่านออกเสียง"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => generateStory(selectedType!)}
                      className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-white/30 transition-colors"
                    >
                      <RefreshCcw className="w-3 h-3" /> เรื่องใหม่
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-5">
              {loading && !story && (
                <div className="flex items-center gap-3 text-purple-500 py-6 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Kido กำลังแต่งนิทาน...</span>
                </div>
              )}
              {story && (
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{story}</p>
              )}
              {story && !loading && (
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                  <span className="text-lg">⭐</span>
                  <span className="text-xs text-gray-400 font-medium">จบนิทาน • แต่งโดย Kido AI</span>
                  <span className="text-lg">⭐</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
