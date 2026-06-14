"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, Send, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const SUBJECTS = [
  { id: "thai",    emoji: "📚", label: "ภาษาไทย",    color: "from-red-400 to-rose-500"     },
  { id: "english", emoji: "🔤", label: "ภาษาอังกฤษ", color: "from-blue-400 to-indigo-500"  },
  { id: "math",    emoji: "🔢", label: "คณิตศาสตร์",  color: "from-green-400 to-emerald-500" },
  { id: "science", emoji: "🔬", label: "วิทยาศาสตร์", color: "from-purple-400 to-violet-500" },
  { id: "general", emoji: "💡", label: "ทั่วไป",       color: "from-amber-400 to-orange-500"  },
];

const QUICK_PROMPTS: Record<string, string[]> = {
  thai:    ["ช่วยอธิบายคำว่า 'กตัญญู' หน่อย", "วิธีแต่งประโยคให้ถูกต้อง", "คำควบกล้ำคืออะไร?"],
  english: ["What does 'curious' mean?", "How do I use 'because'?", "Difference between 'a' and 'an'?"],
  math:    ["ช่วยสอนการคูณ 7×8", "เศษส่วนคืออะไร?", "3+5×2 เท่ากับเท่าไร?"],
  science: ["ทำไมท้องฟ้าถึงสีฟ้า?", "พืชได้อาหารจากไหน?", "ดาวเคราะห์มีกี่ดวง?"],
  general: ["ช่วยสอนวันในสัปดาห์", "จังหวัดในไทยมีกี่จังหวัด?", "ทำไมต้องนอนหลับ?"],
};

interface Msg { role: "user" | "kido"; text: string }

export default function LearningPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const ageYears  = childAge ? parseInt(childAge) || 8 : 8;

  const [subject, setSubject]   = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(q?: string) {
    const question = (q ?? input).trim();
    if (!question || !subject || loading) return;
    setInput("");
    const history = messages;
    setMessages((p) => [...p, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/kido-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, subject, childName, ageYears, history }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let kidoText  = "";
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <div className="p-4 pt-6 pb-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🎓 Kido Learning</h1>
            <p className="text-sm text-gray-500">ผู้ช่วยการเรียนของ{childName}</p>
          </div>
        </div>

        {/* Subject pills */}
        <div className="flex gap-2 flex-wrap pb-4">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSubject(s.id); setMessages([]); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
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

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 max-w-2xl mx-auto w-full pb-4">
        {!subject ? (
          <div className="text-center py-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kido-think.png" alt="Kido" className="w-24 h-24 object-contain mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-medium">เลือกวิชาที่อยากได้รับความช่วยเหลือก่อนนะ!</p>
          </div>
        ) : messages.length === 0 && !loading ? (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl border border-blue-100 p-4 flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain shrink-0" />
              <div className="bg-blue-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                <p className="text-gray-800 text-sm font-semibold">สวัสดี{childName}! 🎓</p>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Kido พร้อมช่วยแล้ว! พิมพ์คำถามหรือโจทย์ที่ยังไม่เข้าใจ
                  Kido จะอธิบายทีละขั้น ไม่เฉลยตรงๆ นะ 😊
                </p>
              </div>
            </div>
            {/* Quick prompts */}
            <p className="text-xs text-gray-400 font-medium px-1">💡 ลองถามเรื่องนี้:</p>
            <div className="space-y-2">
              {QUICK_PROMPTS[subject]?.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 hover:border-purple-200 hover:bg-purple-50/30 transition-colors active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                {msg.role === "kido" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/kido-point.png" alt="Kido" className="w-8 h-8 object-contain shrink-0 mb-0.5" />
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.text || (msg.role === "kido" ? "…" : "")}
                </div>
              </div>
            ))}
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
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      {subject && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 max-w-2xl mx-auto w-full">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="mb-2 text-[11px] text-gray-400 flex items-center gap-1 hover:text-gray-600"
            >
              <RotateCcw className="w-3 h-3" /> เริ่มบทสนทนาใหม่
            </button>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="พิมพ์คำถามหรือโจทย์ที่ยังไม่เข้าใจ..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:bg-white transition-colors"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
