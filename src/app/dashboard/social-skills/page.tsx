"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";

const SCENARIOS = [
  {
    id: 1,
    emoji: "🤝",
    title: "เพื่อนอยากยืมของเล่น",
    situation: "น้องกำลังเล่นของเล่นชิ้นโปรดอยู่ แล้วเพื่อนเดินมาขอยืม น้องควรทำอะไร?",
    choices: [
      { text: "บอกว่า 'ได้เลย รอแป๊บนะ ฉันเล่นเสร็จแล้วจะให้'", correct: true },
      { text: "บอกว่า 'ไม่ให้! ของฉัน'", correct: false },
      { text: "วิ่งหนีไปเล่นที่อื่น", correct: false },
    ],
    tip: "การแบ่งปันไม่ได้แปลว่าต้องยกให้ทันที แต่หมายถึงการตกลงกันด้วยความเข้าใจ 💛",
  },
  {
    id: 2,
    emoji: "🚶",
    title: "รอคิวซื้อขนม",
    situation: "น้องอยากได้ขนมมากๆ แต่มีคนรออยู่ก่อนแล้ว น้องควรทำอะไร?",
    choices: [
      { text: "เดินแซงคิวเพื่อซื้อก่อน", correct: false },
      { text: "ต่อคิวหลังคนอื่นๆ และรอด้วยความใจเย็น", correct: true },
      { text: "ร้องไห้ขอให้ซื้อก่อน", correct: false },
    ],
    tip: "การรอคิวแสดงให้เห็นว่าเราเคารพผู้อื่น คนที่รอได้คือคนที่แข็งแกร่ง! 💪",
  },
  {
    id: 3,
    emoji: "🙏",
    title: "ครูช่วยหยิบของ",
    situation: "คุณครูช่วยหยิบดินสอที่น้องทำหล่น น้องควรพูดว่าอะไร?",
    choices: [
      { text: "ไม่พูดอะไร เดินหยิบไปเลย", correct: false },
      { text: "พูดว่า 'ขอบคุณครับ/ค่ะ' แล้วยิ้มให้", correct: true },
      { text: "พูดว่า 'ทำไมไม่หยิบให้เร็วกว่านี้'", correct: false },
    ],
    tip: "คำว่า 'ขอบคุณ' เล็กน้อยแต่ทำให้ทุกคนรู้สึกดี ลองใช้บ่อยๆ นะ! 😊",
  },
  {
    id: 4,
    emoji: "💦",
    title: "พลาดทำน้ำหก",
    situation: "น้องเดินแล้วทำน้ำหกใส่เพื่อน เพื่อนเสื้อเปียก น้องควรทำอะไร?",
    choices: [
      { text: "พูดว่า 'ขอโทษนะ ฉันไม่ได้ตั้งใจ' แล้วช่วยเช็ด", correct: true },
      { text: "เดินหนีทำเป็นไม่รู้ไม่เห็น", correct: false },
      { text: "บอกว่า 'ไม่ใช่ความผิดฉัน'", correct: false },
    ],
    tip: "การขอโทษเมื่อทำผิดพลาดแสดงให้เห็นว่าเราใจกว้างและรับผิดชอบ 🌟",
  },
  {
    id: 5,
    emoji: "🤗",
    title: "เพื่อนร้องไห้",
    situation: "น้องเห็นเพื่อนนั่งร้องไห้คนเดียวอยู่ในห้อง น้องควรทำอะไร?",
    choices: [
      { text: "เดินเข้าไปถามว่า 'เป็นยังไงบ้าง? ช่วยอะไรได้ไหม?'", correct: true },
      { text: "เดินผ่านไปเฉยๆ ไม่ใช่เรื่องของเรา", correct: false },
      { text: "ไปบอกเพื่อนคนอื่นมาดูเขา", correct: false },
    ],
    tip: "การเข้าหาคนที่เศร้าด้วยความห่วงใยคือทักษะสังคมที่สำคัญมาก 💖",
  },
];

export default function SocialSkillsPage() {
  const { childProfile } = useProfile();
  const childName = childProfile?.name ?? "น้อง";

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore]       = useState(0);
  const [done, setDone]         = useState(false);

  const scenario = SCENARIOS[current];

  function handleChoice(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (scenario.choices[idx].correct) setScore((s) => s + 1);
  }

  function next() {
    if (current + 1 >= SCENARIOS.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🤝 Kido Social Skills</h1>
            <p className="text-sm text-gray-500">ฝึกทักษะสังคมกับ Kido</p>
          </div>
        </div>

        {done ? (
          /* ── Result ── */
          <div className="text-center">
            <div className="bg-white rounded-3xl border border-green-100 shadow-md p-8 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-celebrate.png" alt="Kido" className="w-24 h-24 object-contain mx-auto mb-4" />
              <h2 className="font-black text-2xl text-gray-900 mb-2">เก่งมาก{childName}! 🎉</h2>
              <p className="text-4xl font-black text-green-500 mb-2">{score}/{SCENARIOS.length}</p>
              <p className="text-gray-400 text-sm">
                {score >= 4 ? "ทักษะสังคมเยี่ยมมาก! เพื่อนๆ โชคดีที่มีคุณ 💚"
                  : score >= 2 ? "ดีมาก! ลองฝึกต่อเรื่อยๆ นะ 😊"
                  : "ไม่เป็นไร เราเรียนรู้ได้เสมอ 💪"}
              </p>
            </div>

            {/* Skill tips */}
            <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 mb-4">
              <p className="font-bold text-gray-800 mb-3 text-sm">💡 ทักษะสังคม 5 ข้อที่ควรจำ</p>
              {[
                "🤝 แบ่งปันและรอคอยด้วยใจเย็น",
                "🙏 พูดขอบคุณทุกครั้งที่ได้รับความช่วยเหลือ",
                "😔 ขอโทษเมื่อทำผิดพลาดด้วยความจริงใจ",
                "👂 ฟังคนอื่นก่อนพูด",
                "🤗 ช่วยเหลือเพื่อนเมื่อเห็นว่าเศร้าหรือต้องการความช่วยเหลือ",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm leading-relaxed text-gray-700">{tip}</span>
                </div>
              ))}
            </div>

            <button
              onClick={restart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-base active:scale-[0.98] transition-transform"
            >
              เล่นอีกครั้ง 🔄
            </button>
          </div>
        ) : (
          /* ── Scenario ── */
          <>
            {/* Progress */}
            <div className="flex gap-1.5 mb-5">
              {SCENARIOS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < current ? "bg-green-400" : i === current ? "bg-purple-400" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Kido intro */}
            <div className="flex items-start gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain shrink-0" />
              <div className="bg-green-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                <p className="text-gray-800 text-sm font-semibold">ข้อ {current + 1}: {scenario.title} {scenario.emoji}</p>
              </div>
            </div>

            {/* Situation card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
              <p className="text-gray-800 font-semibold text-base leading-relaxed">{scenario.situation}</p>
            </div>

            {/* Choices */}
            <div className="space-y-3 mb-5">
              {scenario.choices.map((choice, idx) => {
                let cls = "w-full p-4 rounded-2xl border-2 text-left text-sm transition-all ";
                if (selected === null) {
                  cls += "bg-white border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 active:scale-[0.98]";
                } else if (choice.correct) {
                  cls += "bg-green-50 border-green-400";
                } else if (selected === idx) {
                  cls += "bg-red-50 border-red-300";
                } else {
                  cls += "bg-white border-gray-100 opacity-50";
                }
                return (
                  <button key={idx} onClick={() => handleChoice(idx)} disabled={selected !== null} className={cls}>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 mt-0.5">
                        {selected !== null
                          ? choice.correct
                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                            : selected === idx
                            ? <XCircle className="w-5 h-5 text-red-400" />
                            : <span className="w-5 h-5 block" />
                          : <span className="w-5 h-5 rounded-full border-2 border-gray-300 block" />}
                      </span>
                      <span className={selected !== null && choice.correct ? "font-bold text-green-700" : "text-gray-700"}>
                        {choice.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tip + Next */}
            {selected !== null && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-amber-800 text-sm font-semibold">💡 Kido บอกว่า:</p>
                  <p className="text-amber-700 text-sm mt-1 leading-relaxed">{scenario.tip}</p>
                </div>
                <button
                  onClick={next}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-black text-base active:scale-[0.98] transition-transform"
                >
                  {current + 1 >= SCENARIOS.length ? "ดูผลลัพธ์ 🏆" : "ข้อต่อไป →"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
