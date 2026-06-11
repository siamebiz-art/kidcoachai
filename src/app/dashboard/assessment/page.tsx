"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/use-profile";
import { calculateAge } from "@/lib/profile-utils";
import toast from "react-hot-toast";
import {
  Brain, CheckCircle2, ChevronRight, ChevronLeft, RotateCcw,
  Trophy, AlertTriangle, Info, Loader2, Sparkles,
} from "lucide-react";

const questions = [
  { id: 1, category: "ภาษา", categoryColor: "bg-emerald-100 text-emerald-700",
    question: "ลูกสามารถพูดคำศัพท์ที่มีความหมายได้กี่คำ?",
    options: [
      { label: "ยังไม่มี หรือน้อยมาก (0-5 คำ)", value: 1 },
      { label: "พอสมควร (6-20 คำ)", value: 2 },
      { label: "มาก (20-50 คำ)", value: 3 },
      { label: "มากกว่า 50 คำ", value: 4 },
    ],
  },
  { id: 2, category: "ภาษา", categoryColor: "bg-emerald-100 text-emerald-700",
    question: "ลูกสามารถพูดประโยคสั้นๆ (2-3 คำ) ได้หรือไม่?",
    options: [
      { label: "ยังไม่ได้เลย", value: 1 },
      { label: "พยายามบ้าง แต่ยังไม่ชัด", value: 2 },
      { label: "ได้บ้างในบางสถานการณ์", value: 3 },
      { label: "ได้เป็นปกติ", value: 4 },
    ],
  },
  { id: 3, category: "การสื่อสาร", categoryColor: "bg-blue-100 text-blue-700",
    question: "ลูกสบตาเวลาคุยกับผู้อื่นบ้างไหม?",
    options: [
      { label: "แทบไม่สบตาเลย", value: 1 },
      { label: "สบตาน้อยมาก", value: 2 },
      { label: "สบตาบ้างบางครั้ง", value: 3 },
      { label: "สบตาได้เป็นปกติ", value: 4 },
    ],
  },
  { id: 4, category: "การสื่อสาร", categoryColor: "bg-blue-100 text-blue-700",
    question: "ลูกแสดงท่าทีสนใจเล่นกับเด็กคนอื่นหรือไม่?",
    options: [
      { label: "ไม่สนใจเด็กคนอื่นเลย", value: 1 },
      { label: "สนใจแต่ไม่เข้าหา", value: 2 },
      { label: "เข้าหาบ้างบางครั้ง", value: 3 },
      { label: "ชอบเล่นกับเพื่อนมาก", value: 4 },
    ],
  },
  { id: 5, category: "การเรียนรู้", categoryColor: "bg-purple-100 text-purple-700",
    question: "ลูกสามารถทำตามคำสั่งง่ายๆ เช่น 'เอาของมาให้' ได้หรือไม่?",
    options: [
      { label: "ยังทำไม่ได้", value: 1 },
      { label: "ทำได้บ้างแต่ต้องชี้นำ", value: 2 },
      { label: "ทำได้เกือบทุกครั้ง", value: 3 },
      { label: "ทำได้ดีมาก", value: 4 },
    ],
  },
  { id: 6, category: "สมาธิ", categoryColor: "bg-red-100 text-red-700",
    question: "ลูกสามารถนั่งทำกิจกรรมเดิมนานแค่ไหน?",
    options: [
      { label: "น้อยกว่า 1 นาที", value: 1 },
      { label: "1-3 นาที", value: 2 },
      { label: "3-5 นาที", value: 3 },
      { label: "มากกว่า 5 นาที", value: 4 },
    ],
  },
  { id: 7, category: "สมาธิ", categoryColor: "bg-red-100 text-red-700",
    question: "ลูกวิ่งซน ไม่อยู่นิ่ง หรือมีพฤติกรรมหุนหันพลันแล่นบ้างไหม?",
    options: [
      { label: "มากมาย แทบควบคุมไม่ได้", value: 1 },
      { label: "ค่อนข้างมาก", value: 2 },
      { label: "บ้างตามวัย", value: 3 },
      { label: "ปกติมาก", value: 4 },
    ],
  },
  { id: 8, category: "กล้ามเนื้อมัดเล็ก", categoryColor: "bg-amber-100 text-amber-700",
    question: "ลูกสามารถจับดินสอหรือช้อนได้อย่างไร?",
    options: [
      { label: "ยังจับไม่ได้เลย", value: 1 },
      { label: "จับได้แต่ยังไม่มั่นคง", value: 2 },
      { label: "จับได้พอสมควร", value: 3 },
      { label: "จับได้มั่นและใช้งานได้ดี", value: 4 },
    ],
  },
];

type Results = {
  ภาษา: number; การสื่อสาร: number; การเรียนรู้: number; สมาธิ: number; กล้ามเนื้อ: number; overall: number;
};

function getStatusInfo(score: number) {
  if (score >= 75) return { label: "ปกติดี", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle2 };
  if (score >= 50) return { label: "ควรเฝ้าระวัง", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Info };
  return { label: "ควรประเมินเพิ่มเติม", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle };
}

export default function AssessmentPage() {
  const router = useRouter();
  const { isLoaded, childProfile, saveAssessment, saveAssessmentAndPlan } = useProfile();

  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [childAge, setChildAge] = useState("");
  const [childName, setChildName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from profile on load
  if (isLoaded && childProfile && !childName) {
    setChildName(childProfile.name);
    if (childProfile.birthdate) setChildAge(calculateAge(childProfile.birthdate));
  }

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [questions[currentQ].id]: value };
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("result");
    }
  };

  const calcResults = (): Results => {
    const catScores: Record<string, number[]> = {
      ภาษา: [], การสื่อสาร: [], การเรียนรู้: [], สมาธิ: [], กล้ามเนื้อ: [],
    };
    questions.forEach((q) => {
      const cat = q.category === "กล้ามเนื้อมัดเล็ก" ? "กล้ามเนื้อ" : q.category;
      if (answers[q.id]) catScores[cat].push(answers[q.id]);
    });
    const result: Results = { ภาษา: 0, การสื่อสาร: 0, การเรียนรู้: 0, สมาธิ: 0, กล้ามเนื้อ: 0, overall: 0 };
    let total = 0;
    let count = 0;
    (Object.keys(catScores) as (keyof typeof catScores)[]).forEach((cat) => {
      const scores = catScores[cat];
      if (scores.length) {
        const pct = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 4) * 100);
        (result as Record<string, number>)[cat] = pct;
        total += pct;
        count++;
      }
    });
    result.overall = count ? Math.round(total / count) : 0;
    return result;
  };

  const handleSaveAndGeneratePlan = async () => {
    const results = calcResults();
    setIsSaving(true);
    const toastId = toast.loading("กำลังบันทึกและสร้างแผน...");
    try {
      const name = childName || childProfile?.name || "ลูก";
      const age = childAge || (childProfile?.birthdate ? calculateAge(childProfile.birthdate) : "ไม่ระบุ");

      // Save assessment
      await saveAssessment({
        date: new Date().toISOString(),
        childName: name,
        childAge: age,
        scores: {
          ภาษา: results.ภาษา,
          การสื่อสาร: results.การสื่อสาร,
          การเรียนรู้: results.การเรียนรู้,
          สมาธิ: results.สมาธิ,
          กล้ามเนื้อ: results.กล้ามเนื้อ,
        },
        overall: results.overall,
      });

      // Generate plan via AI
      const profile = childProfile ?? {
        name,
        birthdate: "",
        gender: "" as const,
        diagnosisKey: "other",
        diagnosisLabel: "ไม่ระบุ",
      };

      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfile: profile,
          assessmentScores: {
            ภาษา: results.ภาษา,
            การสื่อสาร: results.การสื่อสาร,
            การเรียนรู้: results.การเรียนรู้,
            สมาธิ: results.สมาธิ,
            กล้ามเนื้อ: results.กล้ามเนื้อ,
          },
        }),
      });

      if (res.ok) {
        const { plan } = await res.json();
        await saveAssessmentAndPlan(
          {
            date: new Date().toISOString(),
            childName: name,
            childAge: age,
            scores: {
              ภาษา: results.ภาษา,
              การสื่อสาร: results.การสื่อสาร,
              การเรียนรู้: results.การเรียนรู้,
              สมาธิ: results.สมาธิ,
              กล้ามเนื้อ: results.กล้ามเนื้อ,
            },
            overall: results.overall,
          },
          { generatedAt: new Date().toISOString(), childName: name, ...plan }
        );
        toast.success("บันทึกและสร้างแผนสำเร็จ!", { id: toastId });
      } else {
        toast.success("บันทึกผลสำเร็จ (สร้างแผนได้ที่หน้าแผนการฝึก)", { id: toastId });
      }
      router.push("/dashboard/plan");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
  };

  if (step === "intro") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ประเมินพัฒนาการเบื้องต้น</h1>
          <p className="text-gray-500 leading-relaxed">
            แบบสอบถามสั้นๆ 8 ข้อ ช่วยประเมินพัฒนาการของลูก 5 ด้าน ใช้เวลาประมาณ 3-5 นาที
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">ข้อสำคัญ</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                การประเมินนี้เป็นเพียงการคัดกรองเบื้องต้นเพื่อช่วยวางแผนการฝึก
                ไม่ใช่การวินิจฉัยโรค หากมีข้อกังวล กรุณาปรึกษากุมารแพทย์หรือผู้เชี่ยวชาญ
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-6 border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลเด็ก</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">ชื่อเล่น</label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="เช่น น้องนุ่น"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">อายุ</label>
              <input
                type="text"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                placeholder="เช่น 4 ปี 2 เดือน"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
              />
            </div>
          </div>
        </Card>

        <Button
          onClick={() => setStep("quiz")}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl py-6 text-lg"
        >
          เริ่มประเมิน
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    );
  }

  if (step === "quiz") {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">ข้อ {currentQ + 1} จาก {questions.length}</span>
            <Badge className={q.categoryColor}>{q.category}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Card className="p-6 mb-6 border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">{q.question}</h2>
        </Card>
        <div className="space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="w-full text-left px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all text-sm font-medium text-gray-700"
            >
              {opt.label}
            </button>
          ))}
        </div>
        {currentQ > 0 && (
          <button onClick={() => setCurrentQ(currentQ - 1)} className="flex items-center gap-2 text-sm text-gray-500 mt-4 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
          </button>
        )}
      </div>
    );
  }

  const results = calcResults();
  const categories = [
    { key: "ภาษา", icon: "💬", color: "text-emerald-600", barColor: "bg-emerald-500" },
    { key: "การสื่อสาร", icon: "🤝", color: "text-blue-600", barColor: "bg-blue-500" },
    { key: "การเรียนรู้", icon: "🧠", color: "text-purple-600", barColor: "bg-purple-500" },
    { key: "สมาธิ", icon: "🎯", color: "text-red-500", barColor: "bg-red-500" },
    { key: "กล้ามเนื้อ", icon: "💪", color: "text-amber-600", barColor: "bg-amber-500" },
  ];
  const overallStatus = getStatusInfo(results.overall);
  const StatusIcon = overallStatus.icon;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">ผลการประเมิน</h1>
        </div>
        {childName && <p className="text-gray-500">{childName} • {childAge}</p>}
      </div>

      <Card className={`p-5 mb-5 border ${overallStatus.bg} shadow-sm`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-8 h-8 ${overallStatus.color}`} />
          <div>
            <div className="font-bold text-gray-900 text-lg">คะแนนรวม {results.overall}%</div>
            <div className={`text-sm font-medium ${overallStatus.color}`}>{overallStatus.label}</div>
          </div>
        </div>
      </Card>

      <Card className="p-5 mb-5 border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">คะแนนรายด้าน</h3>
        <div className="space-y-4">
          {categories.map((cat) => {
            const score = (results as Record<string, number>)[cat.key] || 0;
            const status = getStatusInfo(score);
            return (
              <div key={cat.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{cat.key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    <span className={`text-sm font-bold ${cat.color}`}>{score}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.barColor} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 mb-5 border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">คำแนะนำเบื้องต้น</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">✓</span>
            AI จะสร้างแผนฝึกเฉพาะตัวจากผลนี้ให้คุณ
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">✓</span>
            ฝึกสม่ำเสมอวันละ 20-30 นาที ดีกว่าฝึกนานๆ แต่ไม่บ่อย
          </p>
          <p className="flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">✓</span>
            ให้กำลังใจและชื่นชมทุกความก้าวหน้าเล็กน้อยของลูก
          </p>
          {results.overall < 50 && (
            <p className="flex items-start gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              แนะนำให้ปรึกษากุมารแพทย์หรือนักพัฒนาการเด็กด้วยค่ะ
            </p>
          )}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset} className="flex-1 border-gray-200 rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" />
          ทำใหม่
        </Button>
        <Button
          onClick={handleSaveAndGeneratePlan}
          disabled={isSaving}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างแผน...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> บันทึกและสร้างแผน</>
          )}
        </Button>
      </div>
    </div>
  );
}
