"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, Loader2, RefreshCcw, Volume2, ImageIcon, FileText } from "lucide-react";
import toast from "react-hot-toast";
import type { IllustratedStory, StoryScene } from "@/app/api/kido-story-illustrated/route";

const STORY_TYPES = [
  { id: "bedtime",     emoji: "🌙", title: "นิทานก่อนนอน",   desc: "ผ่อนคลายและนอนหลับดี",     color: "from-indigo-400 to-purple-500" },
  { id: "eq",          emoji: "💛", title: "ฝึก EQ",           desc: "เข้าใจความรู้สึกตัวเอง",   color: "from-yellow-400 to-amber-500"  },
  { id: "manners",     emoji: "🤝", title: "มารยาทดี",         desc: "เป็นคนดีมีน้ำใจ",           color: "from-green-400 to-emerald-500" },
  { id: "discipline",  emoji: "⭐", title: "ฝึกวินัย",         desc: "รับผิดชอบและตั้งใจ",        color: "from-blue-400 to-cyan-500"     },
  { id: "inspiration", emoji: "🚀", title: "แรงบันดาลใจ",     desc: "ฝันใหญ่และกล้าลองใหม่",     color: "from-pink-400 to-rose-500"     },
];

function pollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=512&nologo=true&model=flux-schnell&seed=${seed}`;
}

function SceneCard({ scene, index, seed, activeColor }: {
  scene: StoryScene;
  index: number;
  seed: number;
  activeColor: string;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgUrl = pollinationsUrl(scene.imagePrompt, seed + index);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Image */}
      <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-purple-50 to-indigo-50">
        {!imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-purple-300 animate-spin" />
                <p className="text-xs text-purple-300">กำลังวาดภาพ...</p>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl}
              alt={`ฉากที่ ${index + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">🖼️</span>
            <p className="text-xs text-gray-400">ไม่สามารถโหลดภาพได้</p>
          </div>
        )}
        {/* Scene number badge */}
        <div className={`absolute top-3 left-3 w-7 h-7 rounded-full bg-gradient-to-br ${activeColor} flex items-center justify-center shadow-md`}>
          <span className="text-white text-xs font-black">{index + 1}</span>
        </div>
      </div>

      {/* Scene text */}
      <div className="p-4">
        <p className="text-gray-700 text-sm leading-relaxed">{scene.text}</p>
      </div>
    </div>
  );
}

export default function StoryPage() {
  const { childProfile, childAge } = useProfile();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<(typeof STORY_TYPES)[0] | null>(null);
  const [mode, setMode] = useState<"plain" | "illustrated">("illustrated");

  /* plain story state */
  const [story, setStory] = useState("");
  const [loadingPlain, setLoadingPlain] = useState(false);

  /* illustrated story state */
  const [illustrated, setIllustrated] = useState<IllustratedStory | null>(null);
  const [loadingIllustrated, setLoadingIllustrated] = useState(false);
  const [storySeed, setStorySeed] = useState(0);

  const ageYears  = childAge ? parseInt(childAge) || 5 : 5;
  const childName = childProfile?.name ?? "น้อง";
  const loading   = loadingPlain || loadingIllustrated;

  async function generatePlain(typeId: string) {
    const type = STORY_TYPES.find((t) => t.id === typeId);
    if (!type) return;
    setLoadingPlain(true);
    setStory("");
    setIllustrated(null);
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
        return;
      }
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStory((p) => p + decoder.decode(value, { stream: true }));
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoadingPlain(false);
    }
  }

  async function generateIllustrated(typeId: string) {
    const type = STORY_TYPES.find((t) => t.id === typeId);
    if (!type) return;
    setLoadingIllustrated(true);
    setIllustrated(null);
    setStory("");
    setSelectedType(typeId);
    setActiveType(type);
    setStorySeed(Math.floor(Math.random() * 99999));

    try {
      const res = await fetch("/api/kido-story-illustrated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, storyType: typeId, ageYears }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const data = await res.json() as IllustratedStory | { error: string };
      if ("error" in data) { toast.error(data.error); return; }
      setIllustrated(data);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoadingIllustrated(false);
    }
  }

  function handleGenerate(typeId: string) {
    if (loading) return;
    if (mode === "illustrated") generateIllustrated(typeId);
    else generatePlain(typeId);
  }

  function readAloud() {
    if (typeof window === "undefined") return;
    const text = mode === "illustrated" && illustrated
      ? illustrated.scenes.map((s) => s.text).join(" ")
      : story;
    if (!text) return;
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = "th-TH";
    utt.rate   = 0.85;
    window.speechSynthesis.speak(utt);
  }

  const hasContent = (mode === "illustrated" && illustrated) || (mode === "plain" && story);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pt-2">
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

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => { setMode("illustrated"); setStory(""); setIllustrated(null); setSelectedType(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === "illustrated"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            มีภาพประกอบ
          </button>
          <button
            onClick={() => { setMode("plain"); setStory(""); setIllustrated(null); setSelectedType(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === "plain"
                ? "bg-white text-gray-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            แบบข้อความ
          </button>
        </div>

        {/* Kido intro card */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm">
              สวัสดี{childName}! 📖 Kido มีนิทานพิเศษมาเล่าให้ฟังนะ
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {mode === "illustrated"
                ? "✨ แบบมีภาพประกอบ — Kido จะวาดภาพแต่ละฉากให้ด้วย!"
                : "เลือกประเภทนิทานที่อยากฟังได้เลย"}
            </p>
          </div>
        </div>

        {/* Story type buttons */}
        <div className="space-y-3 mb-6">
          {STORY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleGenerate(type.id)}
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

        {/* ── Illustrated Story ── */}
        {mode === "illustrated" && (
          <>
            {loadingIllustrated && !illustrated && (
              <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-8 text-center mb-4">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                <p className="text-purple-600 font-bold text-sm">Kido กำลังแต่งนิทาน...</p>
                <p className="text-gray-400 text-xs mt-1">รอสักครู่ Kido จะวาดภาพให้ด้วยนะ ✨</p>
              </div>
            )}

            {illustrated && (
              <div className="space-y-4 mb-4">
                {/* Story header */}
                <div className={`bg-gradient-to-r ${activeType?.color ?? "from-indigo-500 to-purple-600"} rounded-3xl p-5 flex items-center gap-3`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain shrink-0" />
                  <div className="flex-1">
                    <p className="text-white font-black text-base">{illustrated.title}</p>
                    <p className="text-white/70 text-xs">นิทานของ{childName} · {illustrated.scenes.length} ฉาก 🎨</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={readAloud}
                      className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                      title="อ่านออกเสียง"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => selectedType && generateIllustrated(selectedType)}
                      className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-white/30 transition-colors"
                    >
                      <RefreshCcw className="w-3 h-3" /> เรื่องใหม่
                    </button>
                  </div>
                </div>

                {/* Scene cards */}
                {illustrated.scenes.map((scene, i) => (
                  <SceneCard
                    key={i}
                    scene={scene}
                    index={i}
                    seed={storySeed}
                    activeColor={activeType?.color ?? "from-indigo-400 to-purple-500"}
                  />
                ))}

                {/* End card */}
                <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-5 text-center">
                  <p className="text-2xl mb-2">⭐</p>
                  <p className="text-xs text-gray-400 font-medium">จบนิทาน • แต่งและวาดภาพโดย Kido AI</p>
                  <p className="text-xs text-purple-400 mt-1 font-semibold">"{childName} เก่งมากที่อ่านจนจบ! 🌟"</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Plain Story ── */}
        {mode === "plain" && (loadingPlain || story) && (
          <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
            <div className={`bg-gradient-to-r ${activeType?.color ?? "from-indigo-500 to-purple-600"} px-5 py-3.5 flex items-center gap-3`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-point.png" alt="Kido" className="w-9 h-9 object-contain shrink-0" />
              <div className="flex-1">
                <div className="text-white font-black text-sm">{activeType?.title ?? "นิทาน"}</div>
                <div className="text-white/60 text-[10px]">เรื่องราวของ{childName} 🌟</div>
              </div>
              <div className="flex items-center gap-2">
                {!loadingPlain && story && (
                  <>
                    <button onClick={readAloud} className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => selectedType && generatePlain(selectedType)}
                      className="bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-white/30 transition-colors"
                    >
                      <RefreshCcw className="w-3 h-3" /> เรื่องใหม่
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-5">
              {loadingPlain && !story && (
                <div className="flex items-center gap-3 text-purple-500 py-6 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Kido กำลังแต่งนิทาน...</span>
                </div>
              )}
              {story && (
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{story}</p>
              )}
              {story && !loadingPlain && (
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                  <span className="text-lg">⭐</span>
                  <span className="text-xs text-gray-400 font-medium">จบนิทาน • แต่งโดย Kido AI</span>
                  <span className="text-lg">⭐</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt: switch to illustrated if viewing plain */}
        {mode === "plain" && hasContent && !loadingPlain && (
          <div className="mt-4 bg-purple-50 border border-purple-100 rounded-2xl p-3 flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-xs text-purple-700 flex-1">ลอง <span className="font-bold">แบบมีภาพประกอบ</span> สนุกกว่าเยอะเลย! 🎨</p>
            <button
              onClick={() => { setMode("illustrated"); if (selectedType) generateIllustrated(selectedType); }}
              className="text-xs font-bold text-purple-600 shrink-0 bg-purple-100 px-3 py-1.5 rounded-xl hover:bg-purple-200 transition-colors"
            >
              ลองเลย →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
