"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import {
  ChevronLeft, Send, Loader2, RotateCcw, Camera, Mic, MicOff,
  Lightbulb, BookOpen, X, Volume2, Paperclip,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Subjects ── */
const SUBJECTS = [
  { id: "thai",    emoji: "📚", label: "ภาษาไทย",    color: "from-red-400 to-rose-500"     },
  { id: "english", emoji: "🔤", label: "ภาษาอังกฤษ", color: "from-blue-400 to-indigo-500"  },
  { id: "math",    emoji: "➕", label: "คณิตศาสตร์",  color: "from-green-400 to-emerald-500" },
  { id: "science", emoji: "🔬", label: "วิทยาศาสตร์", color: "from-purple-400 to-violet-500" },
  { id: "social",  emoji: "🌏", label: "สังคมศึกษา",  color: "from-amber-400 to-orange-500"  },
  { id: "art",     emoji: "🎨", label: "ศิลปะ",        color: "from-pink-400 to-rose-500"     },
  { id: "general", emoji: "💡", label: "ทั่วไป",       color: "from-teal-400 to-cyan-500"     },
];

const QUICK_PROMPTS: Record<string, string[]> = {
  thai:    ["ช่วยอธิบายคำว่า 'กตัญญู' หน่อย", "วิธีแต่งประโยคให้ถูกต้อง", "คำควบกล้ำคืออะไร?"],
  english: ["What does 'curious' mean?", "How do I use 'because'?", "Difference: 'a' vs 'an'?"],
  math:    ["ช่วยสอนการคูณ 7×8", "เศษส่วนคืออะไร?", "3+5×2 เท่ากับเท่าไร?"],
  science: ["ทำไมท้องฟ้าถึงสีฟ้า?", "พืชได้อาหารจากไหน?", "ดาวเคราะห์มีกี่ดวง?"],
  social:  ["กรุงเทพฯ เป็นเมืองหลวงตั้งแต่เมื่อไหร่?", "ภาคกลางมีจังหวัดอะไรบ้าง?", "เศรษฐกิจคืออะไร?"],
  art:     ["สีขั้นที่ 2 คืออะไร?", "ส่วนประกอบของภาพวาดมีอะไรบ้าง?", "ดนตรีไทยมีเครื่องดนตรีอะไรบ้าง?"],
  general: ["ทำไมต้องนอนหลับ?", "ฝนตกเกิดจากอะไร?", "จังหวัดในไทยมีกี่จังหวัด?"],
};

const LEARNING_KEY = "kidocoachai-learning";

interface Msg { role: "user" | "kido"; text: string; isImage?: boolean }
interface LearningLog { date: string; subject: string; minutes: number }

function saveLearningLog(subject: string, minutes: number) {
  if (typeof window === "undefined") return;
  try {
    const key  = new Date().toISOString().slice(0, 10);
    const raw  = localStorage.getItem(LEARNING_KEY);
    const logs: LearningLog[] = raw ? JSON.parse(raw) : [];
    const today = logs.find((l) => l.date === key && l.subject === subject);
    if (today) today.minutes += minutes;
    else logs.push({ date: key, subject, minutes });
    localStorage.setItem(LEARNING_KEY, JSON.stringify(logs.slice(-30)));
  } catch { /* ignore */ }
}

export function loadLearningLogs(): LearningLog[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LEARNING_KEY) ?? "[]"); }
  catch { return []; }
}

/* ════════════════════════════════════════════════════ */
export default function LearningPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const ageYears  = childAge ? parseInt(childAge) || 8 : 8;

  const [subject,    setSubject]    = useState<string | null>(null);
  const [messages,   setMessages]   = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  /* image */
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64,  setImageBase64]  = useState<string | null>(null);
  const [imageType,    setImageType]    = useState("image/jpeg");
  /* voice */

  const [isListening, setIsListening] = useState(false);
  /* practice */
  const [showPractice, setShowPractice] = useState(false);
  const [practiceText, setPracticeText] = useState("");
  const [practiceLoading, setPracticeLoading] = useState(false);
  /* session timer */
  const sessionStart  = useRef(0);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const bottomRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, practiceText]);

  /* save learning time on unmount */
  useEffect(() => {
    if (!subject) return;
    sessionStart.current = Date.now();
    return () => {
      const mins = Math.round((Date.now() - sessionStart.current) / 60000);
      if (mins >= 1) saveLearningLog(subject, mins);
    };
  }, [subject]);

  /* ── Image upload ── */
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
  }

  /* ── Voice input ── */
  function toggleMic() {
    if (isListening) {
      recogRef.current?.abort();
      setIsListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Browser นี้ไม่รองรับการพูด"); return; }
    const recog = new SR();
    recogRef.current = recog;
    recog.lang = "th-TH";
    recog.interimResults = false;
    recog.onstart  = () => setIsListening(true);
    recog.onend    = () => setIsListening(false);
    recog.onerror  = () => setIsListening(false);
    recog.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      setInput(e.results[0][0].transcript);
    };
    recog.start();
  }

  /* ── TTS for Kido messages ── */
  function speak(text: string) {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text.replace(/[^฀-๿\s\w.,!?]/g, ""));
    utt.lang   = "th-TH";
    utt.rate   = 0.88;
    window.speechSynthesis.speak(utt);
  }

  /* ── Send message ── */
  const sendMsg = useCallback(async (
    opts: { text?: string; isHint?: boolean; hintLevel?: number } = {}
  ) => {
    const q = (opts.text ?? input).trim();
    if ((!q && !imageBase64) || !subject || loading) return;
    if (!opts.isHint) setInput("");

    const history = messages;
    if (!opts.isHint) {
      setMessages((p) => [
        ...p,
        { role: "user", text: q || "📷 ส่งรูปโจทย์", isImage: !!imageBase64 },
      ]);
    }
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        question: opts.isHint ? undefined : q,
        subject,
        childName,
        ageYears,
        history,
        mode: opts.isHint ? "hint" : "chat",
        hintLevel: opts.hintLevel,
      };
      if (imageBase64 && !opts.isHint) {
        body.imageBase64 = imageBase64;
        body.imageType   = imageType;
        body.mode        = "chat";
        clearImage();
      }

      const res = await fetch("/api/kido-homework", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }

      let kidoText = "";
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      setMessages((p) => [...p, { role: "kido", text: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        kidoText += decoder.decode(value, { stream: true });
        setMessages((p) => {
          const copy = [...p];
          copy[copy.length - 1] = { role: "kido", text: kidoText };
          return copy;
        });
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [input, messages, subject, childName, ageYears, imageBase64, imageType, loading]);

  /* ── Practice Generator ── */
  async function generatePractice() {
    if (!subject || practiceLoading) return;
    setShowPractice(true);
    setPracticeText("");
    setPracticeLoading(true);
    try {
      const lastKido = [...messages].reverse().find((m) => m.role === "kido")?.text ?? "";
      const res = await fetch("/api/kido-homework", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject, childName, ageYears,
          mode: "practice",
          topic: lastKido.slice(0, 80),
        }),
      });
      if (!res.ok) { setPracticeLoading(false); return; }
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setPracticeText((p) => p + decoder.decode(value, { stream: true }));
      }
    } finally {
      setPracticeLoading(false);
    }
  }

  const hasConversation = messages.length >= 2;
  const lastKidoMsg     = [...messages].reverse().find((m) => m.role === "kido")?.text ?? "";

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">

      {/* Header */}
      <div className="px-4 pt-6 pb-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl text-gray-900">🎓 Kido Learning</h1>
            <p className="text-sm text-gray-500">ผู้ช่วยสอนการบ้านของ{childName}</p>
          </div>
        </div>

        {/* Subject pills — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSubject(s.id); setMessages([]); setPracticeText(""); setShowPractice(false); }}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1 ${
                subject === s.id
                  ? "border-purple-400 bg-purple-50 text-purple-700 shadow-sm"
                  : "border-gray-100 bg-white text-gray-600 hover:border-purple-200"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 max-w-2xl mx-auto w-full">

        {/* Empty state */}
        {!subject ? (
          <div className="text-center py-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kido-think.png" alt="Kido" className="w-24 h-24 object-contain mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-medium">เลือกวิชาที่ต้องการก่อนนะ!</p>
          </div>
        ) : messages.length === 0 && !loading ? (
          <div className="space-y-3 pb-4">
            {/* Kido intro */}
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain shrink-0" />
              <div className="bg-blue-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                <p className="text-gray-800 text-sm font-semibold">สวัสดี{childName}! 🎓</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  พิมพ์ถาม · <span className="font-bold text-blue-600">📷 ถ่ายรูป</span> · หรือ <span className="font-bold text-purple-600">📎 แนบไฟล์</span> ได้เลยนะ
                  Kido จะสอนทีละขั้น ตอบถูกต้อง 100% 😊
                </p>
              </div>
            </div>
            {/* Quick prompts */}
            <p className="text-xs text-gray-400 font-medium px-1 mt-4">💡 ลองถามเรื่องนี้:</p>
            {QUICK_PROMPTS[subject]?.map((q) => (
              <button
                key={q}
                onClick={() => sendMsg({ text: q })}
                className="w-full text-left bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 hover:border-purple-200 hover:bg-purple-50/30 transition-colors active:scale-[0.98]"
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                {msg.role === "kido" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/kido-point.png" alt="Kido" className="w-8 h-8 object-contain shrink-0 mb-0.5" />
                )}
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.text || "…"}
                  </div>
                  {/* TTS button for Kido messages */}
                  {msg.role === "kido" && msg.text && (
                    <button
                      onClick={() => speak(msg.text)}
                      className="self-start flex items-center gap-1 text-[10px] text-gray-400 hover:text-purple-500 transition-colors ml-1"
                    >
                      <Volume2 className="w-3 h-3" /> ฟัง
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && messages[messages.length - 1]?.role !== "kido" && (
              <div className="flex items-end gap-2 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kido-point.png" alt="Kido" className="w-8 h-8 object-contain shrink-0" />
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hint Mode buttons */}
        {hasConversation && !loading && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" /> ต้องการคำใบ้ไหม?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 1, label: "🌱 ใบ้นิดหน่อย" },
                { level: 2, label: "💡 อธิบายวิธี" },
                { level: 3, label: "✅ เฉลยพร้อมอธิบาย" },
              ].map(({ level, label }) => (
                <button
                  key={level}
                  onClick={() => sendMsg({ isHint: true, hintLevel: level })}
                  disabled={loading}
                  className="py-2 rounded-xl bg-white border border-amber-200 text-amber-700 text-[10px] font-bold hover:bg-amber-100 transition-colors active:scale-95 disabled:opacity-40"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Practice Generator */}
        {hasConversation && !loading && (
          <div className="mb-4">
            {!showPractice ? (
              <button
                onClick={generatePractice}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <BookOpen className="w-4 h-4" /> สร้างแบบฝึกหัด 5 ข้อ
              </button>
            ) : (
              <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-black text-sm">📝 แบบฝึกหัดของ{childName}</span>
                  {!practiceLoading && (
                    <button onClick={generatePractice} className="text-white/70 text-[10px] hover:text-white">🔄 สร้างใหม่</button>
                  )}
                </div>
                <div className="p-4">
                  {practiceLoading && !practiceText ? (
                    <div className="flex items-center gap-2 text-green-600 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Kido กำลังสร้างโจทย์...</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{practiceText}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="โจทย์" className="max-h-48 rounded-2xl border border-gray-200 shadow-sm" />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-gray-400 mt-1">📷 รูปโจทย์พร้อมส่ง</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {subject && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 max-w-2xl mx-auto w-full">
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setPracticeText(""); setShowPractice(false); }}
              className="mb-2 text-[11px] text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> เริ่มใหม่
            </button>
          )}
          <div className="flex gap-2 items-end">
            {/* Camera button — เปิดกล้องถ่ายรูปโดยตรง */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="ถ่ายรูปโจทย์"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* File attach button — เลือกไฟล์จากเครื่อง/คลังภาพ */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 shrink-0 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-purple-50 hover:text-purple-600 transition-colors"
              title="แนบไฟล์รูปภาพ"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Text input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
              }}
              placeholder={imagePreview ? "เพิ่มคำถามเกี่ยวกับรูปนี้ (หรือกด → เลย)" : "พิมพ์คำถามหรือโจทย์ที่ยังไม่เข้าใจ..."}
              rows={1}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:bg-white transition-colors resize-none"
              disabled={loading}
              style={{ minHeight: "40px", maxHeight: "100px" }}
            />

            {/* Mic button */}
            <button
              onClick={toggleMic}
              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
              }`}
              title={isListening ? "หยุดฟัง" : "พูดถาม"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Send button */}
            <button
              onClick={() => sendMsg()}
              disabled={(!input.trim() && !imageBase64) || loading}
              className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
