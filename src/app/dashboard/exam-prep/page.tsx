"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, FileText, Zap, CheckCircle2, XCircle, Volume2, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const SUBJECTS = [
  { id: "thai",    label: "ภาษาไทย",    emoji: "📖" },
  { id: "english", label: "อังกฤษ",     emoji: "🔤" },
  { id: "math",    label: "คณิตศาสตร์", emoji: "🔢" },
  { id: "science", label: "วิทยาศาสตร์", emoji: "🔬" },
  { id: "social",  label: "สังคมศึกษา", emoji: "🌍" },
];

const LEVELS = ["p1","p2","p3","p4","p5","p6"] as const;
const LEVEL_LABELS: Record<string, string> = { p1:"ป.1", p2:"ป.2", p3:"ป.3", p4:"ป.4", p5:"ป.5", p6:"ป.6" };

interface Question { q: string; c: string[]; a: number; e: string }

export default function ExamPrepPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const defaultLevel = childAge ? `p${Math.max(1, Math.min(6, Math.round(parseInt(childAge) - 5)))}` : "p3";

  const [subject, setSubject] = useState("thai");
  const [level, setLevel] = useState(defaultLevel);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"quiz" | "summary" | null>(null);
  const [loading, setLoading] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answered, setAnswered] = useState<(number | null)[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  // Summary state
  const [summary, setSummary] = useState("");

  function reset() {
    setMode(null);
    setQuestions([]);
    setAnswered([]);
    setQuizDone(false);
    setSummary("");
  }

  async function startQuiz() {
    if (!topic.trim()) { toast.error("กรุณาใส่หัวข้อที่ต้องการเตรียมสอบ"); return; }
    setLoading(true);
    setMode("quiz");
    setQuestions([]);
    setAnswered([]);
    setQuizDone(false);
    try {
      const res = await fetch("/api/kido-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "quiz", subject, topic: topic.trim(), level, childName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        reset();
        return;
      }
      const data = (await res.json()) as { questions?: Question[]; error?: string };
      if (data.error || !data.questions) {
        toast.error(data.error ?? "เกิดข้อผิดพลาด");
        reset();
        return;
      }
      setQuestions(data.questions);
      setAnswered(new Array(data.questions.length).fill(null));
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      reset();
    } finally {
      setLoading(false);
    }
  }

  async function startSummary() {
    if (!topic.trim()) { toast.error("กรุณาใส่หัวข้อที่ต้องการสรุป"); return; }
    setLoading(true);
    setMode("summary");
    setSummary("");
    try {
      const res = await fetch("/api/kido-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "summary", subject, topic: topic.trim(), level, childName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        reset();
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
        setSummary(full);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      reset();
    } finally {
      setLoading(false);
    }
  }

  function answerQuestion(qi: number, ci: number) {
    if (answered[qi] !== null) return;
    const next = [...answered];
    next[qi] = ci;
    setAnswered(next);
    if (next.every((a) => a !== null)) setQuizDone(true);
  }

  function speakSummary() {
    if (!summary || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(summary);
    utt.lang = "th-TH";
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  }

  const quizScore = answered.filter((a, i) => a !== null && a === questions[i]?.a).length;

  /* ── Quiz view ── */
  if (mode === "quiz") {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">Kido กำลังสร้างข้อสอบ...</p>
            <p className="text-sm text-gray-400 mt-1">รอสักครู่นะ</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pt-2">
            <button onClick={reset} className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-black text-xl text-gray-900">📝 Quiz</h1>
              <p className="text-sm text-gray-500">{SUBJECTS.find(s=>s.id===subject)?.label} · {LEVEL_LABELS[level]} · {topic}</p>
            </div>
          </div>

          {quizDone && (
            <div className={`rounded-3xl p-5 mb-4 border ${quizScore === questions.length ? "bg-green-50 border-green-200" : quizScore >= questions.length * 0.6 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{quizScore === questions.length ? "🏆" : quizScore >= questions.length * 0.6 ? "👍" : "💪"}</span>
                <div>
                  <p className="text-2xl font-black text-gray-800">{quizScore}/{questions.length} ถูก</p>
                  <p className="text-sm text-gray-600">
                    {quizScore === questions.length ? `สมบูรณ์แบบ! ${childName} เก่งมาก!` : quizScore >= questions.length * 0.6 ? "ดีมาก! ใกล้สมบูรณ์แล้ว" : "ลองทบทวนแล้วสอบใหม่นะ"}
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="mt-3 w-full py-2 rounded-xl bg-white border text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> สอบใหม่
              </button>
            </div>
          )}

          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                <p className="font-bold text-gray-800 text-sm mb-3">
                  <span className="text-orange-500 font-black">ข้อ {qi + 1}.</span> {q.q}
                </p>
                <div className="space-y-2">
                  {q.c.map((choice, ci) => {
                    const isAnswered = answered[qi] !== null;
                    const isCorrect  = ci === q.a;
                    const isSelected = answered[qi] === ci;
                    let cls = "border-gray-100 bg-gray-50 text-gray-700";
                    if (isAnswered) {
                      if (isCorrect) cls = "border-green-300 bg-green-50 text-green-800";
                      else if (isSelected) cls = "border-red-300 bg-red-50 text-red-700";
                      else cls = "border-gray-100 bg-gray-50 text-gray-400";
                    }
                    return (
                      <button
                        key={ci}
                        onClick={() => answerQuestion(qi, ci)}
                        disabled={isAnswered}
                        className={`w-full text-left px-4 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-2 ${cls} ${!isAnswered ? "hover:border-orange-200 hover:bg-orange-50" : ""}`}
                      >
                        <span className="font-bold text-xs opacity-60">{["A","B","C","D"][ci]}</span>
                        <span className="flex-1">{choice}</span>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {answered[qi] !== null && (
                  <div className={`mt-2 px-3 py-2 rounded-xl text-xs ${answered[qi] === q.a ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                    💡 {q.e}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Summary view ── */
  if (mode === "summary") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pt-2">
            <button onClick={reset} className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-black text-xl text-gray-900">📄 สรุปบทเรียน</h1>
              <p className="text-sm text-gray-500">{SUBJECTS.find(s=>s.id===subject)?.label} · {topic}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-teal-100 shadow-md p-5 mb-4 min-h-32">
            {loading && !summary ? (
              <div className="flex items-center gap-2 text-teal-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Kido กำลังสรุป...</span>
              </div>
            ) : (
              <p className="text-gray-800 text-sm leading-loose whitespace-pre-wrap">{summary}</p>
            )}
          </div>

          {summary && (
            <div className="flex gap-3">
              <button
                onClick={speakSummary}
                className="flex-1 py-3 rounded-2xl bg-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors"
              >
                <Volume2 className="w-4 h-4" /> ฟังสรุป
              </button>
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-2xl bg-white border-2 border-teal-200 text-teal-700 font-bold text-sm hover:bg-teal-50 transition-colors"
              >
                สรุปใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Setup screen ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">📝 Exam Prep</h1>
            <p className="text-sm text-gray-500">เตรียมสอบกับ Kido</p>
          </div>
        </div>

        {/* Subject selector */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">วิชา</p>
          <div className="grid grid-cols-5 gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubject(s.id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                  subject === s.id ? "bg-orange-50 border-orange-300 shadow-sm" : "bg-gray-50 border-transparent hover:bg-orange-50 hover:border-orange-100"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] font-bold text-gray-700 leading-tight text-center">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3">ระดับชั้น</p>
          <div className="grid grid-cols-6 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`py-2 rounded-xl font-bold text-sm transition-all ${
                  level === l ? "bg-orange-400 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-orange-50"
                }`}
              >
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-5">
          <p className="text-xs font-bold text-gray-500 mb-2">หัวข้อที่ต้องการเตรียม</p>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              subject === "thai"    ? "เช่น สระในภาษาไทย, การอ่านจับใจความ" :
              subject === "english" ? "เช่น Past Tense, Animals vocabulary" :
              subject === "math"    ? "เช่น การบวกลบ, เศษส่วน, พื้นที่สี่เหลี่ยม" :
              subject === "science" ? "เช่น ระบบสุริยะ, ร่างกายมนุษย์" :
                                     "เช่น ภูมิภาคของไทย, ประวัติศาสตร์ไทย"
            }
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-orange-300 focus:outline-none text-sm text-gray-800 bg-gray-50"
          />
        </div>

        {/* Mode buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startQuiz}
            disabled={!topic.trim() || loading}
            className="py-4 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 text-white font-black text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-40 flex flex-col items-center gap-1.5"
          >
            <Zap className="w-6 h-6" />
            Quiz อัตโนมัติ
            <span className="text-[10px] font-medium opacity-80">5 ข้อ ปรนัย</span>
          </button>
          <button
            onClick={startSummary}
            disabled={!topic.trim() || loading}
            className="py-4 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-white font-black text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-40 flex flex-col items-center gap-1.5"
          >
            <FileText className="w-6 h-6" />
            สรุปบทเรียน
            <span className="text-[10px] font-medium opacity-80">สรุปสั้นๆ + เคล็ดลับ</span>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-5 border border-orange-100">
          <p className="text-xs font-bold text-orange-700 mb-3">💡 วิธีใช้ Exam Prep ให้ได้ประโยชน์สูงสุด</p>
          <div className="space-y-2">
            {[
              { e: "📄", t: "สรุปบทเรียนก่อน แล้วค่อยทำ Quiz" },
              { e: "🔄", t: "ลอง Quiz หลายๆ ครั้งจนได้คะแนนเต็ม" },
              { e: "🎯", t: "ใส่หัวข้อเฉพาะ เช่น 'การคูณเลข 2 หลัก'" },
              { e: "🎧", t: "กด 'ฟังสรุป' แล้วทำอย่างอื่นไปด้วยได้" },
            ].map((t) => (
              <div key={t.e} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-orange-50">
                <span>{t.e}</span>
                <span className="text-xs text-gray-600">{t.t}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
