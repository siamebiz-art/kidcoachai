"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { DAY_KEYS } from "@/lib/profile-utils";
import type { DayKey, PlanActivity } from "@/lib/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Bell, ChevronRight, CheckCircle2, Info, Loader2, Sparkles,
  Flame, Zap, Send, Mic, Camera, BarChart3, Volume2, Clock,
  Star, Trophy,
} from "lucide-react";

const rawToday = new Date().getDay();
const adjustedToday = rawToday === 0 ? 6 : rawToday - 1;
const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const scoreConfig = [
  { key: "ภาษา",        icon: "💬", bg: "bg-emerald-50", border: "border-emerald-100", textColor: "text-emerald-600", barColor: "bg-emerald-400", color: "#10B981" },
  { key: "การสื่อสาร",  icon: "🤝", bg: "bg-blue-50",    border: "border-blue-100",    textColor: "text-blue-600",    barColor: "bg-blue-400",    color: "#3B82F6" },
  { key: "การเรียนรู้", icon: "🧠", bg: "bg-purple-50",  border: "border-purple-100",  textColor: "text-purple-600",  barColor: "bg-purple-400",  color: "#8B5CF6" },
  { key: "สมาธิ",       icon: "🎯", bg: "bg-orange-50",  border: "border-orange-100",  textColor: "text-orange-500",  barColor: "bg-orange-400",  color: "#F97316" },
  { key: "กล้ามเนื้อ",  icon: "💪", bg: "bg-pink-50",    border: "border-pink-100",    textColor: "text-pink-600",    barColor: "bg-pink-400",    color: "#EC4899" },
];

const RECOMMENDED_ACTS = [
  { emoji: "🧩", title: "เกมจับคู่ภาพ", desc: "พัฒนาการสังเกตและคำศัพท์", duration: "10 นาที", gradient: "from-purple-400 to-violet-500", aiPick: true,  href: "/dashboard/activities" },
  { emoji: "📖", title: "นิทานเสียง",   desc: "พัฒนาการฟังและจินตนาการ",    duration: "10 นาที", gradient: "from-pink-400 to-rose-500",   aiPick: false, href: "/dashboard/activities" },
  { emoji: "🃏", title: "บัตรคำศัพท์",  desc: "ฝึกจำคำและการพูด",           duration: "10 นาที", gradient: "from-blue-400 to-cyan-500",   aiPick: false, href: "/dashboard/activities" },
];

function getScoreBadge(score: number) {
  if (score >= 75) return { label: "ดีมาก",        dot: "bg-green-400",  text: "text-green-700", bg: "bg-green-50"  };
  if (score >= 50) return { label: "กำลังพัฒนา",   dot: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50" };
  return                   { label: "ควรฝึกเพิ่ม", dot: "bg-red-400",    text: "text-red-600",   bg: "bg-red-50"    };
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

  const todayKey = DAY_KEYS[adjustedToday] as DayKey;
  const todayActivities: PlanActivity[] = weeklyPlan ? ((weeklyPlan[todayKey] as PlanActivity[]) ?? []) : [];
  const scores = latestAssessment?.scores ?? null;
  const overall = latestAssessment?.overall ?? 0;

  const streakDays = new Set(
    Object.entries(activityLog)
      .filter(([k, v]) => v && !k.startsWith("lib-"))
      .map(([k]) => k.split("-")[0])
  ).size;
  const level = getStreakLevel(streakDays);

  const progressChange =
    assessmentHistory.length >= 2
      ? latestAssessment!.overall - assessmentHistory[assessmentHistory.length - 2].overall
      : null;

  const aiRec = (() => {
    if (!childProfile || !latestAssessment) return null;
    const sc = latestAssessment.scores as unknown as Record<string, number>;
    const sorted = Object.entries(sc).sort(([, a], [, b]) => a - b);
    const weakest = sorted[0][0];
    const strongest = sorted[sorted.length - 1][0];
    return {
      text: `จากข้อมูลล่าสุด ${childProfile.name} มีพัฒนาการด้าน${strongest}ดีขึ้น 🎉 วันนี้ AI แนะนำกิจกรรมที่จะช่วยพัฒนาด้าน${weakest}และคำศัพท์ใหม่`,
      weakest,
    };
  })();

  const chartData = assessmentHistory.length > 0
    ? assessmentHistory.map((a) => ({
        เดือน: new Date(a.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
        ...a.scores,
      }))
    : latestAssessment
      ? [{ เดือน: new Date(latestAssessment.date).toLocaleDateString("th-TH", { month: "short" }), ...latestAssessment.scores }]
      : [];

  const ACHIEVEMENTS = [
    { emoji: "🎤", title: "พูดคำใหม่ได้",   sub: "10 คำ",    earned: !!latestAssessment },
    { emoji: "🔥", title: "ฝึกครบ 7 วัน",  sub: "",         earned: streakDays >= 7 },
    { emoji: "🎯", title: "สมาธิดีขึ้น",   sub: "10 นาที",  earned: overall >= 60 },
    { emoji: "👨‍👩‍👧", title: "แบ่งปันครอบครัว", sub: "ครั้งแรก", earned: !!weeklyPlan },
  ];

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
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl pl-12 lg:pl-0">
            <p className="text-sm text-purple-800">
              👋 ยินดีต้อนรับ! กรุณา{" "}
              <Link href="/dashboard/settings?tab=child" className="font-bold underline">ตั้งค่าข้อมูลเด็ก</Link>
              {" "}และ{" "}
              <Link href="/dashboard/assessment" className="font-bold underline">ทำแบบประเมิน</Link>
              {" "}เพื่อรับแผนฝึกเฉพาะตัวค่ะ
            </p>
          </div>
        )}

        {/* ── Top Bar (3-col) ── */}
        <div className="flex items-center gap-4 mb-5 pl-12 lg:pl-0">

          {/* Left: avatar + greeting + chips */}
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
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">สวัสดีค่ะ {displayName} 👋</h1>
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
                  พัฒนาการเพิ่มขึ้น <span className="font-bold text-green-600 ml-0.5">{progressChange >= 0 ? "+" : ""}{progressChange}%</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> ทำแบบประเมินเพื่อติดตามพัฒนาการ
                </div>
              )}
              <div className="text-xs text-gray-600 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                AI แนะนำกิจกรรมใหม่สำหรับวันนี้ 🎉
              </div>
            </div>
          )}

          {/* Right: bell + avatar */}
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

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-5">

          {/* ═══ LEFT COLUMN ═══ */}
          <div className="space-y-5">

            {/* Score Cards */}
            <Card className="p-5 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  พัฒนาการโดยรวม <Info className="w-4 h-4 text-gray-300" />
                </h2>
                <Link href="/dashboard/progress">
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5 hover:text-blue-700">
                    ดูรายละเอียดทั้งหมด <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              {!scores ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">ยังไม่ได้ประเมินพัฒนาการ</p>
                  <Link href="/dashboard/assessment">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2">
                      <Sparkles className="w-4 h-4" /> เริ่มประเมินพัฒนาการ
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
                        <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shadow-sm mx-auto mb-2`}>
                          <span className="text-2xl">{s.icon}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-0.5">{s.key}</div>
                        <div className={`text-2xl font-black ${s.textColor} leading-none`}>{score}<span className="text-xs font-semibold text-gray-400">/100</span></div>
                        <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden my-2">
                          <div className={`h-full ${s.barColor} rounded-full`} style={{ width: `${score}%` }} />
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </div>
                        <div className="text-[9px] text-gray-400 mt-1">ดีกว่าเด็กวัยเดียวกัน {pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Middle 3-col: AI card | Assessment CTA | Streak */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* AI Recommendation card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-400 p-5 shadow-md flex flex-col">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.15),_transparent_60%)]" />
                <div className="relative flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-white text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> AI แนะนำสำหรับวันนี้
                  </div>
                  <div className="text-5xl mb-3 select-none">🤖</div>
                  <p className="text-white text-sm leading-relaxed">
                    {aiRec
                      ? aiRec.text
                      : childProfile
                        ? `ทำแบบประเมินเพื่อให้ AI วิเคราะห์และแนะนำกิจกรรมที่เหมาะกับ${childProfile.name}โดยเฉพาะค่ะ ✨`
                        : "ตั้งค่าข้อมูลเด็กและทำแบบประเมินเพื่อรับคำแนะนำจาก AI ค่ะ"}
                  </p>
                </div>
                <Link href="/dashboard/activities" className="relative mt-4">
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-2xl border border-white/30 transition-colors">
                    เริ่มกิจกรรมแนะนำ →
                  </button>
                </Link>
              </div>

              {/* Assessment CTA */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white flex flex-col items-center text-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">ประเมินพัฒนาการด่วน</h3>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-blue-200 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-10 h-10 text-blue-500" />
                  </div>
                  <p className="text-2xl font-black text-gray-900 mb-1">ประเมินลูก 3 นาที</p>
                  <p className="text-xs text-gray-500 leading-relaxed">รู้ผลทันที พร้อมคำแนะนำจาก AI</p>
                </div>
                <Link href="/dashboard/assessment" className="w-full mt-4">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 rounded-2xl font-bold">
                    เริ่มประเมินเลย →
                  </Button>
                </Link>
              </Card>

              {/* Streak counter */}
              <Card className="p-5 shadow-sm border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden flex flex-col">
                <div className="absolute -right-3 -top-3 text-7xl opacity-10 select-none pointer-events-none">🔥</div>
                <div className="relative flex-1">
                  <h3 className="font-bold text-gray-800 mb-3">ฝึกต่อเนื่อง</h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl select-none">🔥</span>
                    <span className="text-6xl font-black text-orange-500 leading-none">{streakDays}</span>
                    <span className="text-xl font-bold text-orange-400 mb-1">วัน</span>
                  </div>
                  <p className="text-xs text-orange-600 mb-4">
                    {streakDays >= 7 ? "เก่งมาก! รักษาฟอร์มให้ดีนะ 👏" : streakDays > 0 ? "ต่อเนื่องอีกนะคะ 💪" : "เริ่มฝึกวันนี้เลยนะคะ!"}
                  </p>
                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {DAY_LABELS.map((label, i) => {
                      const dk = DAY_KEYS[i] as DayKey;
                      const acts = weeklyPlan ? ((weeklyPlan[dk] as PlanActivity[]) ?? []) : [];
                      const done = acts.some((_, idx) => activityLog[`${dk}-${idx}`]);
                      const isToday = i === adjustedToday;
                      return (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                          <div className={`w-full aspect-square rounded-full flex items-center justify-center transition-all text-xs ${
                            done
                              ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm"
                              : isToday
                                ? "bg-orange-200 border-2 border-orange-400"
                                : "bg-white border border-orange-200"
                          }`}>
                            {done ? <span className="text-white text-[10px]">✓</span> : isToday ? <span className="text-orange-600 text-[8px]">★</span> : null}
                          </div>
                          <span className="text-[8px] text-gray-400 font-medium">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom 3-col: Activities | Chart | Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Activity List */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-sm">กิจกรรมแนะนำสำหรับวันนี้</h2>
                  <Link href="/dashboard/activities">
                    <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5">ดูทั้งหมด <ChevronRight className="w-3 h-3" /></span>
                  </Link>
                </div>
                <div className="space-y-3">
                  {RECOMMENDED_ACTS.map((act) => (
                    <div key={act.title} className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${act.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-2xl">{act.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-semibold text-gray-800 truncate">{act.title}</span>
                          {act.aiPick && (
                            <span className="inline-flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              <Sparkles className="w-2.5 h-2.5" /> แนะนำโดย AI
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{act.desc}</p>
                        <p className="text-[10px] text-gray-400">{act.duration}</p>
                      </div>
                      <Link href={act.href}>
                        <button className="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                          เริ่มเลย
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Line Chart */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-sm">กราฟพัฒนาการ</h2>
                  <Link href="/dashboard/progress">
                    <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5">ดูรายงาน <ChevronRight className="w-3 h-3" /></span>
                  </Link>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-[180px] flex items-center justify-center text-gray-400 text-xs text-center">
                    ยังไม่มีข้อมูล<br />ทำแบบประเมินก่อน
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="เดือน" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      {scoreConfig.map((s) => (
                        <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={{ r: 2 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Overall Progress */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white flex flex-col">
                <h2 className="font-bold text-gray-900 text-sm mb-4">ความก้าวหน้าโดยรวม</h2>
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#pg2)" strokeWidth="3"
                        strokeDasharray={`${overall} ${100 - overall}`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="pg2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-900">{overall}%</span>
                      <span className="text-[8px] text-gray-400 text-center leading-tight">ผลประเมินล่าสุด</span>
                    </div>
                  </div>
                </div>
                {progressChange !== null && (
                  <div className="text-xs text-green-600 font-semibold text-center mb-3">
                    เพิ่มขึ้น {progressChange >= 0 ? "+" : ""}{progressChange}% จากเดือนที่แล้ว 🚀
                  </div>
                )}
                <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 mt-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-gray-900 text-xs">
                      {childProfile ? `เก่งมากเลย ${childProfile.name}! 💗` : "เริ่มต้นเลย! 💗"}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {latestAssessment
                      ? `ประเมินเมื่อ ${new Date(latestAssessment.date).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}`
                      : "ทำแบบประเมินเพื่อเริ่มติดตาม"}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="space-y-4">

            {/* AI Coach Panel */}
            <Card className="overflow-hidden shadow-sm border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">🤖</div>
                  <div className="flex-1">
                    <div className="text-white font-bold">AI Coach</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-blue-100 text-xs">พร้อมช่วยเสมอ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="p-4 bg-gray-50/70">
                <div className="bg-white text-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm border border-gray-100">
                  {childProfile
                    ? `สวัสดีค่ะ! วันนี้มีอะไรจะถามเกี่ยวกับ${childProfile.name}ไหมคะ? 😊`
                    : "สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ? 😊"}
                </div>
              </div>

              {/* Quick chips 2x2 */}
              <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                {[
                  { label: "แนะนำกิจกรรม", color: "bg-purple-50 border-purple-100 text-purple-700" },
                  { label: "พัฒนาการวันนี้", color: "bg-blue-50 border-blue-100 text-blue-700" },
                  { label: "พฤติกรรม",      color: "bg-amber-50 border-amber-100 text-amber-700" },
                  { label: "โภชนาการ",      color: "bg-green-50 border-green-100 text-green-700" },
                ].map((chip) => (
                  <Link key={chip.label} href={`/dashboard/ai-coach?q=${encodeURIComponent(chip.label)}`}>
                    <button className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl border transition-opacity hover:opacity-80 ${chip.color}`}>
                      {chip.label}
                    </button>
                  </Link>
                ))}
              </div>

              {/* Big CTA button */}
              <div className="px-4 pb-3">
                <Link href="/dashboard/ai-coach">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                    <Mic className="w-4 h-4" /> พูดคุยกับ AI Coach
                  </button>
                </Link>
              </div>

              {/* 3 action buttons */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                {[
                  { icon: Camera,   label: "ส่งคลิป/รูป" },
                  { icon: BarChart3, label: "ดูรายงาน"   },
                  { icon: Volume2,  label: "โหมดเสียง"  },
                ].map(({ icon: Icon, label }) => (
                  <button key={label} className="flex flex-col items-center gap-1 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
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

            {/* Notifications */}
            <Card className="p-4 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-sm">การแจ้งเตือน</h2>
                <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5 cursor-pointer">
                  ดูทั้งหมด <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { emoji: "🔔", label: "ถึงเวลาฝึกกิจกรรมตอนเย็น", time: "19:00", color: "bg-purple-50" },
                  { emoji: "📋", label: "บันทึกผลการฝึกประจำวัน",    time: "20:00", color: "bg-blue-50" },
                  { emoji: "⭐", label: "ประเมินพัฒนาการประจำสัปดาห์", time: "พรุ่งนี้", color: "bg-amber-50" },
                ].map((n, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <div className={`w-7 h-7 ${n.color} rounded-xl flex items-center justify-center shrink-0 text-sm`}>{n.emoji}</div>
                    <div className="flex-1 min-w-0 text-xs text-gray-700 truncate">{n.label}</div>
                    <div className="text-[10px] text-gray-400 shrink-0 font-medium">{n.time}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ความสำเร็จล่าสุด */}
            <Card className="p-4 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-sm">ความสำเร็จล่าสุด</h2>
                <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5 cursor-pointer">
                  ดูทั้งหมด <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ACHIEVEMENTS.map((a) => (
                  <div key={a.title} className="flex flex-col items-center gap-1 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all ${
                      a.earned
                        ? "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 shadow-sm"
                        : "bg-gray-100 border-gray-200 grayscale opacity-40"
                    }`}>
                      {a.emoji}
                    </div>
                    <div className="text-[9px] text-gray-600 font-semibold leading-tight">{a.title}</div>
                    {a.sub && <div className="text-[8px] text-gray-400">{a.sub}</div>}
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
