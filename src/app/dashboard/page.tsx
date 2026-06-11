"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { DAY_KEYS } from "@/lib/profile-utils";
import type { DayKey, PlanActivity } from "@/lib/types";
import {
  Bell, ChevronRight, CheckCircle2, Circle, Sun, Cloud, Moon, Play,
  Send, Star, Trophy, Info, Loader2, Sparkles, Flame, Zap,
} from "lucide-react";

const rawToday = new Date().getDay();
const adjustedToday = rawToday === 0 ? 6 : rawToday - 1;

const scoreConfig = [
  { key: "ภาษา",       icon: "💬", bg: "bg-emerald-50", border: "border-emerald-100", textColor: "text-emerald-600", barColor: "bg-emerald-400" },
  { key: "การสื่อสาร", icon: "🤝", bg: "bg-blue-50",    border: "border-blue-100",    textColor: "text-blue-600",    barColor: "bg-blue-400" },
  { key: "การเรียนรู้", icon: "🧠", bg: "bg-purple-50",  border: "border-purple-100",  textColor: "text-purple-600",  barColor: "bg-purple-400" },
  { key: "สมาธิ",      icon: "🎯", bg: "bg-orange-50",  border: "border-orange-100",  textColor: "text-orange-500",  barColor: "bg-orange-400" },
  { key: "กล้ามเนื้อ", icon: "💪", bg: "bg-pink-50",    border: "border-pink-100",    textColor: "text-pink-600",    barColor: "bg-pink-400" },
];

const timeIcons: Record<string, React.ElementType> = { เช้า: Sun, บ่าย: Cloud, เย็น: Moon };
const timeColors: Record<string, { bg: string; border: string; iconColor: string; time: string }> = {
  เช้า: { bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500", time: "08:00 - 08:15" },
  บ่าย: { bg: "bg-sky-50",   border: "border-sky-100",   iconColor: "text-sky-400",   time: "14:00 - 14:15" },
  เย็น: { bg: "bg-indigo-50",border: "border-indigo-100",iconColor: "text-indigo-500",time: "19:00 - 19:15" },
};

const JOURNEY_STAGES = [
  { emoji: "🌱", label: "เริ่มต้น", max: 25 },
  { emoji: "🌿", label: "พัฒนา",   max: 50 },
  { emoji: "🌳", label: "ก้าวหน้า", max: 75 },
  { emoji: "⭐", label: "เป้าหมาย", max: 100 },
];

function getScoreBadge(score: number) {
  if (score >= 75) return { label: "ดีมาก",        dot: "bg-green-400",  text: "text-green-700", bg: "bg-green-50" };
  if (score >= 50) return { label: "กำลังพัฒนา",   dot: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50" };
  return                   { label: "ควรฝึกเพิ่ม", dot: "bg-red-400",    text: "text-red-600",   bg: "bg-red-50" };
}

function getPercentile(score: number) {
  if (score >= 90) return 95;
  if (score >= 75) return 78;
  if (score >= 60) return 60;
  if (score >= 50) return 45;
  return 25;
}

function getStreakLevel(days: number) {
  if (days >= 14) return { emoji: "🏆", title: "แชมป์นักฝึก" };
  if (days >= 7)  return { emoji: "🌳", title: "นักพัฒนาตัวน้อย" };
  if (days >= 3)  return { emoji: "🌿", title: "นักฝึกตัวน้อย" };
  return                 { emoji: "🌱", title: "นักเริ่มต้น" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const {
    isLoaded, childProfile, childAge, displayName, parentProfile,
    latestAssessment, assessmentHistory, weeklyPlan, activityLog, toggleActivity,
  } = useProfile();

  useEffect(() => {
    if (isLoaded && !childProfile) router.replace("/onboarding");
  }, [isLoaded, childProfile, router]);

  const todayDate = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  const todayKey = DAY_KEYS[adjustedToday] as DayKey;
  const todayActivities: PlanActivity[] = weeklyPlan ? ((weeklyPlan[todayKey] as PlanActivity[]) ?? []) : [];
  const scores = latestAssessment?.scores ?? null;
  const overall = latestAssessment?.overall ?? 0;

  // Streak: count distinct day keys with completed activities
  const streakDays = new Set(
    Object.entries(activityLog)
      .filter(([k, v]) => v && !k.startsWith("lib-"))
      .map(([k]) => k.split("-")[0])
  ).size;
  const level = getStreakLevel(streakDays);

  // Progress change from last 2 assessments
  const progressChange =
    assessmentHistory.length >= 2
      ? latestAssessment!.overall - assessmentHistory[assessmentHistory.length - 2].overall
      : null;

  // AI recommendation card (template-based)
  const aiRec = (() => {
    if (!childProfile || !latestAssessment) return null;
    const sc = latestAssessment.scores as unknown as Record<string, number>;
    const sorted = Object.entries(sc).sort(([, a], [, b]) => a - b);
    const weakest = sorted[0][0];
    const strongest = sorted[sorted.length - 1][0];
    const todayAct = todayActivities[0]?.activity;
    const text = todayAct
      ? `${childProfile.name} มีพัฒนาการด้าน${strongest}ดีมาก! 🌟 วันนี้แนะนำ "${todayAct}" เพื่อเสริมด้าน${weakest}ให้แข็งแกร่งขึ้นค่ะ`
      : `${childProfile.name} กำลังพัฒนาด้าน${weakest} วันนี้ลองเล่นเกมบัตรคำศัพท์ 10 นาทีเพื่อฝึกภาษาและความจำค่ะ`;
    return { text, weakest };
  })();

  // Achievements
  const ACHIEVEMENTS = [
    { emoji: "🏅", title: "นักสำรวจตัวน้อย", desc: "ทำแบบประเมิน",       earned: !!latestAssessment },
    { emoji: "🎯", title: "มีแผนแล้ว",        desc: "สร้างแผนฝึก",        earned: !!weeklyPlan },
    { emoji: "⭐", title: "เริ่มลงมือ",        desc: "ทำกิจกรรมครั้งแรก", earned: Object.values(activityLog).some(Boolean) },
    { emoji: "🔥", title: "ฝึกต่อเนื่อง",     desc: "ทำกิจกรรม 3 วัน",   earned: streakDays >= 3 },
    { emoji: "🌟", title: "เก่งมาก",          desc: "คะแนนรวมเกิน 60",    earned: overall >= 60 },
    { emoji: "🏆", title: "ยอดเยี่ยม",        desc: "คะแนนรวมเกิน 80",    earned: overall >= 80 },
  ];
  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned).length;

  // Growth stage
  const currentStage = JOURNEY_STAGES.findIndex((s) => overall <= s.max);
  const stageIdx = currentStage === -1 ? 3 : currentStage;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30">
      <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">

        {!childProfile && (
          <div className="mb-5 p-4 bg-purple-50 border border-purple-200 rounded-2xl pl-12 lg:pl-0">
            <p className="text-sm text-purple-800">
              👋 ยินดีต้อนรับ! กรุณา{" "}
              <Link href="/dashboard/settings?tab=child" className="font-bold underline">ตั้งค่าข้อมูลเด็ก</Link>
              {" "}และ{" "}
              <Link href="/dashboard/assessment" className="font-bold underline">ทำแบบประเมิน</Link>
              {" "}เพื่อรับแผนฝึกเฉพาะตัวค่ะ
            </p>
          </div>
        )}

        {/* Top Bar — 3-column integrated */}
        <div className="flex items-center gap-4 mb-5 pl-12 lg:pl-0">

          {/* Left: child avatar + greeting + chips */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full ring-4 ring-pink-200 ring-offset-2 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center shadow-lg overflow-hidden">
                {childProfile?.avatar?.startsWith("http") ? (
                  <Image src={childProfile.avatar} alt={childProfile.name} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl lg:text-4xl select-none">{childProfile?.gender === "ชาย" ? "👦" : "👧"}</span>
                )}
              </div>
              {childProfile && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-[10px]">✓</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">สวัสดีค่ะ {displayName} 👋</h1>
              <p className="text-sm lg:text-base font-semibold text-gray-700 mt-0.5">
                {childProfile ? `วันนี้${childProfile.name}เก่งมากเลย! ⭐ 💗` : "เริ่มต้นใช้งาน KidCoach AI 💗"}
              </p>
              {childProfile && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                    <Flame className="w-3 h-3" /> ฝึกต่อเนื่อง {streakDays} วัน
                  </span>
                  <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 rounded-full px-2.5 py-0.5 text-xs font-semibold text-purple-600">
                    {level.emoji} ระดับ {level.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Center: stat summary card */}
          {childProfile && (
            <div className="hidden lg:flex flex-col gap-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl px-5 py-3.5 shrink-0 min-w-[300px]">
              <div className="font-bold text-sm text-gray-800">
                🎯 วันนี้{childProfile.name}ฝึกครบ {streakDays} วันต่อเนื่อง
              </div>
              {progressChange !== null ? (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-green-500" />
                  พัฒนาการเพิ่มขึ้น <span className="font-bold text-green-600">{progressChange >= 0 ? "+" : ""}{progressChange}%</span> จากครั้งที่แล้ว
                </div>
              ) : (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  ทำแบบประเมินเพื่อติดตามพัฒนาการ
                </div>
              )}
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                AI แนะนำกิจกรรมใหม่สำหรับวันนี้ 🎉
              </div>
            </div>
          )}

          {/* Right: notification + avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-purple-200">
              <AvatarImage src={parentProfile?.avatarUrl} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-sm font-medium text-gray-700">{displayName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-5">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="space-y-5">

            {/* AI Recommendation Card */}
            {aiRec ? (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-5 shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_60%)]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🤖</div>
                      <span className="text-white/80 text-sm font-semibold">AI Coach แนะนำวันนี้</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{aiRec.text}</p>
                  </div>
                  <Link href="/dashboard/activities" className="shrink-0">
                    <button className="bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-indigo-50 transition-colors whitespace-nowrap shadow-sm">
                      เริ่มกิจกรรม →
                    </button>
                  </Link>
                </div>
              </div>
            ) : childProfile ? (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-5 shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_60%)]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🤖</div>
                      <span className="text-white/80 text-sm font-semibold">AI Coach แนะนำวันนี้</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">
                      ทำแบบประเมินพัฒนาการเพื่อให้ AI Coach วิเคราะห์และแนะนำกิจกรรมที่เหมาะกับ{childProfile.name}โดยเฉพาะค่ะ ✨
                    </p>
                  </div>
                  <Link href="/dashboard/assessment" className="shrink-0">
                    <button className="bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-indigo-50 transition-colors whitespace-nowrap shadow-sm">
                      เริ่มประเมิน →
                    </button>
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Development Scores */}
            <Card className="p-5 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  คะแนนพัฒนาการล่าสุด
                  <Info className="w-4 h-4 text-gray-300" />
                </h2>
                <Link href="/dashboard/progress">
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5 hover:text-blue-700">
                    ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>

              {!scores ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">ยังไม่ได้ประเมินพัฒนาการ</p>
                  <Link href="/dashboard/assessment">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2">
                      <Sparkles className="w-4 h-4" />
                      เริ่มประเมินพัฒนาการ
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {scoreConfig.map((s) => {
                    const score = (scores as unknown as Record<string, number>)[s.key] ?? 0;
                    const badge = getScoreBadge(score);
                    const pct = getPercentile(score);
                    return (
                      <div key={s.key} className={`${s.bg} border ${s.border} rounded-2xl p-3.5 text-center`}>
                        <div className="flex justify-center mb-2">
                          <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shadow-sm`}>
                            <span className="text-2xl">{s.icon}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-1">{s.key}</div>
                        <div className={`text-3xl font-black ${s.textColor} leading-none mb-1`}>{score}</div>
                        <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${s.barColor} rounded-full`} style={{ width: `${score}%` }} />
                        </div>
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shrink-0`} />
                          {badge.label}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-1">ดีกว่า {pct}% ของเด็กวัยเดียวกัน</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Today Plan + Activities */}
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="p-5 shadow-sm border-gray-100 bg-white flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900">แผนการฝึกวันนี้</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{todayDate}</p>
                  </div>
                  <Link href="/dashboard/plan">
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5">ดูทั้งหมด <ChevronRight className="w-4 h-4" /></span>
                  </Link>
                </div>
                {todayActivities.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-gray-400 text-sm mb-3">{weeklyPlan ? "วันหยุด 😊" : "ยังไม่มีแผนการฝึก"}</p>
                    {!weeklyPlan && (
                      <Link href="/dashboard/assessment">
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl">
                          สร้างแผนฝึก
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1">
                    {todayActivities.map((item, i) => {
                      const key = `${todayKey}-${i}`;
                      const isDone = activityLog[key] ?? false;
                      const Icon = timeIcons[item.time] ?? Sun;
                      const tc = timeColors[item.time] ?? timeColors["เช้า"];
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${tc.bg} ${tc.border}`}>
                          <Icon className={`w-5 h-5 ${tc.iconColor} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-gray-400 font-medium">{tc.time}</div>
                            <div className={`text-sm font-semibold text-gray-800 truncate ${isDone ? "line-through text-gray-400" : ""}`}>{item.activity}</div>
                            <div className="text-xs text-gray-400">{item.duration}</div>
                          </div>
                          <button onClick={() => toggleActivity(key)}>
                            {isDone ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Link href="/dashboard/activities" className="mt-4">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 rounded-xl font-semibold">
                    <Play className="w-4 h-4 mr-2 fill-white" />
                    เริ่มกิจกรรมแรกเลย
                  </Button>
                </Link>
              </Card>

              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">กิจกรรมแนะนำ</h2>
                  <Link href="/dashboard/activities">
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5">ดูทั้งหมด <ChevronRight className="w-4 h-4" /></span>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { title: "เกมชี้รูปภาพ", duration: "10 นาที", gradient: "from-orange-400 to-amber-400", emoji: "👆", bg: "bg-amber-50" },
                    { title: "บัตรคำศัพท์",  duration: "10 นาที", gradient: "from-sky-400 to-blue-500",    emoji: "🃏", bg: "bg-blue-50" },
                    { title: "นิทานสั้น",    duration: "10 นาที", gradient: "from-pink-400 to-rose-500",   emoji: "📖", bg: "bg-pink-50" },
                  ].map((act) => (
                    <Link href="/dashboard/activities" key={act.title}>
                      <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                        <div className={`h-24 bg-gradient-to-br ${act.gradient} flex items-center justify-center`}>
                          <span className="text-4xl">{act.emoji}</span>
                        </div>
                        <div className={`${act.bg} px-2.5 py-2`}>
                          <div className="text-xs font-semibold text-gray-800 leading-tight">{act.title}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[10px] text-gray-400">{act.duration}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>

            {/* Growth Journey + Overall Progress */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Growth Journey */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900">Growth Journey</h2>
                  <Link href="/dashboard/progress">
                    <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">ดูรายงาน <ChevronRight className="w-3 h-3" /></span>
                  </Link>
                </div>
                {!latestAssessment ? (
                  <div className="h-[160px] flex items-center justify-center text-gray-400 text-sm">
                    ยังไม่มีข้อมูล — ทำแบบประเมินก่อน
                  </div>
                ) : (
                  <>
                    {/* Stage track */}
                    <div className="relative flex items-start justify-between mb-4">
                      {/* Connector line */}
                      <div className="absolute top-6 left-6 right-6 h-1 bg-gray-100 rounded-full" />
                      <div
                        className="absolute top-6 left-6 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(stageIdx / 3) * 100}%`, maxWidth: "calc(100% - 48px)" }}
                      />
                      {JOURNEY_STAGES.map((stage, i) => {
                        const isActive = i === stageIdx;
                        const isDone = i < stageIdx;
                        return (
                          <div key={i} className="flex flex-col items-center gap-2 z-10" style={{ width: "25%" }}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all ${
                              isActive
                                ? "bg-white border-green-400 shadow-lg shadow-green-100 scale-110"
                                : isDone
                                  ? "bg-green-100 border-green-300"
                                  : "bg-gray-50 border-gray-200"
                            }`}>
                              {stage.emoji}
                            </div>
                            <div className={`text-[10px] font-semibold text-center ${isActive ? "text-green-600" : isDone ? "text-green-500" : "text-gray-400"}`}>
                              {stage.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mt-2">
                      <p className="text-xs text-green-700 font-medium">
                        {JOURNEY_STAGES[stageIdx].emoji} ตอนนี้อยู่ระดับ <span className="font-bold">{JOURNEY_STAGES[stageIdx].label}</span>
                        {stageIdx < 3 ? ` — อีก ${JOURNEY_STAGES[stageIdx].max - overall} คะแนน ไปถึง${JOURNEY_STAGES[stageIdx + 1].label}` : " — ยอดเยี่ยมมาก! 🎉"}
                      </p>
                    </div>
                  </>
                )}
              </Card>

              {/* Overall Progress */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <h2 className="font-bold text-gray-900 mb-4">ความก้าวหน้าโดยรวม</h2>
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none" stroke="url(#pGrad)" strokeWidth="3"
                        strokeDasharray={`${overall} ${100 - overall}`} strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-900">{overall}%</span>
                      <span className="text-[9px] text-gray-400 text-center leading-tight px-2">
                        {latestAssessment ? "ผลประเมินล่าสุด" : "ยังไม่ได้ประเมิน"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-gray-900 text-sm">
                      {childProfile ? `เก่งมากเลย ${childProfile.name}! 💗` : "เริ่มต้นเลย! 💗"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {latestAssessment
                      ? `ประเมินเมื่อ ${new Date(latestAssessment.date).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}`
                      : "ทำแบบประเมินเพื่อเริ่มติดตามพัฒนาการ"}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="space-y-5">
            {/* AI Coach Chat Panel */}
            <Card className="overflow-hidden shadow-sm border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-xl">🤖</div>
                  <div className="flex-1">
                    <div className="text-white font-bold">AI Coach</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-blue-100 text-xs">พร้อมช่วยเสมอ</span>
                    </div>
                  </div>
                  <Link href="/dashboard/ai-coach">
                    <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors">
                      เปิดเต็มจอ
                    </button>
                  </Link>
                </div>
              </div>
              <div className="p-4 bg-gray-50/70">
                <div className="bg-white text-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm border border-gray-100">
                  {childProfile
                    ? `สวัสดีค่ะ! วันนี้มีอะไรจะถามเกี่ยวกับ${childProfile.name}ไหมคะ? 😊`
                    : "สวัสดีค่ะ! ฉันคือ AI Coach ผู้ช่วยฝึกพัฒนาการเด็ก มีอะไรให้ช่วยไหมคะ? 😊"}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["วันนี้ฝึกอะไรดี?", "ลูกไม่ยอมฝึก", "ความคืบหน้า"].map((q) => (
                    <Link key={q} href={`/dashboard/ai-coach?q=${encodeURIComponent(q)}`}>
                      <button className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                        {q}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="ถามอะไรก็ได้เกี่ยวกับลูก..."
                    className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  <Link href={`/dashboard/ai-coach${chatInput ? `?q=${encodeURIComponent(chatInput)}` : ""}`}>
                    <button className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity">
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Streak & Level */}
            <Card className="p-5 shadow-sm border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden relative">
              <div className="absolute -right-4 -top-4 text-8xl opacity-10 select-none">🔥</div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">Daily Streak</h2>
                  <span className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">
                    {level.emoji} {level.title}
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-6xl font-black text-orange-500 leading-none">{streakDays}</span>
                  <span className="text-lg font-bold text-orange-400 mb-1">วัน</span>
                </div>
                <div className="flex gap-1.5 mb-3">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const dk = DAY_KEYS[i] as DayKey;
                    const acts = weeklyPlan ? ((weeklyPlan[dk] as PlanActivity[]) ?? []) : [];
                    const done = acts.some((_, idx) => activityLog[`${dk}-${idx}`]);
                    const isToday = i === adjustedToday;
                    return (
                      <div
                        key={i}
                        className={`flex-1 h-8 rounded-xl flex items-center justify-center transition-all ${
                          done
                            ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm"
                            : isToday
                              ? "bg-orange-200 border-2 border-orange-400"
                              : "bg-orange-100"
                        }`}
                      >
                        {done && <CheckCircle2 className="w-4 h-4 text-white" />}
                        {!done && isToday && <span className="text-orange-600 text-[10px] font-bold">วันนี้</span>}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-orange-600">
                  {streakDays === 0
                    ? "เริ่มฝึกวันนี้เลยนะคะ! 💪"
                    : streakDays >= 7
                      ? "เก่งมากเลย! ฝึกสม่ำเสมอมาก 🏆"
                      : `ต่อเนื่องอีก ${7 - streakDays} วัน ได้เหรียญ 7 วัน! 🎯`}
                </p>
              </div>
            </Card>

            {/* Achievement Badges */}
            <Card className="p-5 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">เหรียญรางวัล</h2>
                <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded-full">
                  {earnedCount}/{ACHIEVEMENTS.length} เหรียญ
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.title}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition-all ${
                      a.earned
                        ? "bg-amber-50 border-amber-200 shadow-sm"
                        : "bg-gray-50 border-gray-100 opacity-50 grayscale"
                    }`}
                  >
                    <span className="text-2xl">{a.emoji}</span>
                    <div className="text-[10px] font-bold text-gray-700 leading-tight">{a.title}</div>
                    <div className="text-[9px] text-gray-400 leading-tight">{a.desc}</div>
                    {a.earned && (
                      <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
