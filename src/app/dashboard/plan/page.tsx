"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { DAY_KEYS, DAY_NAMES_TH, DAY_SHORT_TH } from "@/lib/profile-utils";
import type { DayKey, PlanActivity } from "@/lib/types";
import toast from "react-hot-toast";
import {
  CheckCircle2, Circle, Sun, Cloud, Moon, Play, ChevronLeft, ChevronRight,
  RefreshCw, Sparkles, Loader2, CalendarX,
} from "lucide-react";

const categoryColors: Record<string, string> = {
  ภาษา: "bg-emerald-100 text-emerald-700",
  การสื่อสาร: "bg-blue-100 text-blue-700",
  การเรียนรู้: "bg-purple-100 text-purple-700",
  สมาธิ: "bg-red-100 text-red-600",
  กล้ามเนื้อ: "bg-amber-100 text-amber-700",
};

const timeIcons: Record<string, React.ElementType> = {
  เช้า: Sun, บ่าย: Cloud, เย็น: Moon,
};

const timeColors: Record<string, { bg: string; border: string; iconColor: string }> = {
  เช้า:  { bg: "bg-amber-50",  border: "border-amber-200",  iconColor: "text-amber-500" },
  บ่าย:  { bg: "bg-blue-50",   border: "border-blue-200",   iconColor: "text-blue-400" },
  เย็น:  { bg: "bg-indigo-50", border: "border-indigo-200", iconColor: "text-indigo-500" },
};

const rawToday = new Date().getDay();
const adjustedToday = rawToday === 0 ? 6 : rawToday - 1;

export default function TrainingPlanPage() {
  const router = useRouter();
  const { isLoaded, childProfile, latestAssessment, weeklyPlan, activityLog, saveWeeklyPlan, toggleActivity } = useProfile();
  const [selectedDay, setSelectedDay] = useState(adjustedToday);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    if (!childProfile) {
      toast.error("กรุณาตั้งค่าข้อมูลเด็กก่อน");
      router.push("/dashboard/settings?tab=child");
      return;
    }
    setIsGenerating(true);
    const toastId = toast.loading("กำลังสร้างแผนฝึก...");
    try {
      const scores = latestAssessment?.scores ?? {
        ภาษา: 50, การสื่อสาร: 50, การเรียนรู้: 50, สมาธิ: 50, กล้ามเนื้อ: 50,
      };
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfile, assessmentScores: scores }),
      });
      if (!res.ok) throw new Error("API error");
      const { plan } = await res.json();
      await saveWeeklyPlan({ generatedAt: new Date().toISOString(), childName: childProfile.name, ...plan });
      toast.success("สร้างแผนสำเร็จ!", { id: toastId });
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // No plan yet — show empty state
  if (!weeklyPlan) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-5">
          <CalendarX className="w-12 h-12 text-purple-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มีแผนการฝึก</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          ทำ<button onClick={() => router.push("/dashboard/assessment")} className="text-purple-600 font-semibold underline">แบบประเมินพัฒนาการ</button>ก่อน
          แล้ว AI จะสร้างแผนฝึกเฉพาะตัวสำหรับลูกคุณ
          {childProfile && " หรือสร้างแผนจากข้อมูลที่มีอยู่ได้เลย"}
        </p>
        {childProfile && (
          <Button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl px-8 py-6 text-lg gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> กำลังสร้าง...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> สร้างแผนฝึกด้วย AI</>
            )}
          </Button>
        )}
        {!childProfile && (
          <Button
            onClick={() => router.push("/dashboard/settings?tab=child")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl px-8 gap-2"
          >
            ตั้งค่าข้อมูลเด็กก่อน
          </Button>
        )}
      </div>
    );
  }

  const dayKey = DAY_KEYS[selectedDay] as DayKey;
  const dayActivities: PlanActivity[] = (weeklyPlan[dayKey] as PlanActivity[]) ?? [];

  const completedCount = dayActivities.filter((_, i) => activityLog[`${dayKey}-${i}`]).length;
  const generatedDate = new Date(weeklyPlan.generatedAt).toLocaleDateString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แผนการฝึก</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {weeklyPlan.childName} • สร้างเมื่อ {generatedDate}
          </p>
        </div>
        <Button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          variant="outline"
          size="sm"
          className="border-purple-200 text-purple-700 gap-2"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          สร้างแผนใหม่
        </Button>
      </div>

      {/* Week Selector */}
      <Card className="p-4 mb-5 border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setSelectedDay((d) => Math.max(0, d - 1))} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700">สัปดาห์นี้</span>
          <button onClick={() => setSelectedDay((d) => Math.min(6, d + 1))} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_SHORT_TH.map((day, i) => {
            const dk = DAY_KEYS[i] as DayKey;
            const acts = (weeklyPlan[dk] as PlanActivity[]) ?? [];
            const hasDone = acts.some((_, idx) => activityLog[`${dk}-${idx}`]);
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                  i === selectedDay
                    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md"
                    : i === adjustedToday
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-xs font-medium">{day}</span>
                <span className={`text-xs mt-0.5 ${i === selectedDay ? "text-purple-200" : "text-gray-400"}`}>
                  {acts.length}
                </span>
                {hasDone && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${i === selectedDay ? "bg-white" : "bg-green-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${dayActivities.length ? (completedCount / dayActivities.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600">{completedCount}/{dayActivities.length} กิจกรรม</span>
      </div>

      {/* Activities */}
      <div className="space-y-4 mb-6">
        <h2 className="font-bold text-gray-900">วัน{DAY_NAMES_TH[dayKey]} — กิจกรรมประจำวัน</h2>

        {dayActivities.length === 0 ? (
          <Card className="p-8 border-gray-100 text-center text-gray-400">วันหยุดพัก 😊</Card>
        ) : (
          dayActivities.map((session, i) => {
            const key = `${dayKey}-${i}`;
            const isDone = activityLog[key] ?? false;
            const Icon = timeIcons[session.time] ?? Sun;
            const tc = timeColors[session.time] ?? timeColors["เช้า"];
            return (
              <Card key={i} className={`p-4 border shadow-sm transition-all ${tc.bg} ${tc.border} ${isDone ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-4">
                  <Icon className={`w-6 h-6 ${tc.iconColor} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">{session.time}</span>
                      <Badge className={`text-xs ${categoryColors[session.category] || "bg-gray-100 text-gray-600"}`}>
                        {session.category}
                      </Badge>
                    </div>
                    <h3 className={`font-semibold text-gray-900 ${isDone ? "line-through text-gray-400" : ""}`}>
                      {session.activity}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{session.duration}</p>
                    {session.description && !isDone && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{session.description}</p>
                    )}
                    {session.tips && !isDone && (
                      <p className="text-xs text-purple-600 mt-1 font-medium">💡 {session.tips}</p>
                    )}
                  </div>
                  <button onClick={() => toggleActivity(key)} className="shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-purple-400 transition-colors" />
                    )}
                  </button>
                </div>
                {!isDone && (
                  <div className="mt-3 ml-10">
                    <Button
                      size="sm"
                      onClick={() => toggleActivity(key)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl h-8 text-xs gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      เริ่มกิจกรรม
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* AI Note */}
      {weeklyPlan.aiNote && (
        <Card className="p-5 border-purple-100 bg-purple-50 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">🤖 หมายเหตุจาก AI Coach</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{weeklyPlan.aiNote}</p>
        </Card>
      )}
    </div>
  );
}
