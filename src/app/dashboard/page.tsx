"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadDailyData, computeBalanceScore, OFFLINE_MISSIONS, type DailyData } from "@/lib/daily-data";
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
  Bell, ChevronRight, CheckCircle2, Circle, Info, Loader2, Sparkles,
  Flame, Zap, Send, Mic, Camera, BarChart3, Volume2, Clock, Star, Trophy,
} from "lucide-react";
import toast from "react-hot-toast";

const KIDO_MESSAGES = [
  "วันนี้หนูเก่งมากเลย! อย่าลืมดื่มน้ำด้วยนะ 💧",
  "คิโด้ดีใจที่ได้เล่นกับหนูมากเลย! หนูเรียนรู้อะไรใหม่วันนี้เหรอ? 🌟",
  "อย่าลืมกอดคุณพ่อหรือคุณแม่วันนี้ด้วยนะ 🤗",
  "ลุกขึ้นเดินสัก 5 นาที แล้วค่อยมาเล่นต่อนะ 🏃",
  "บอกคุณพ่อแม่ว่าวันนี้หนูชอบอะไรที่สุดนะ 😊",
  "การนอนหลับช่วยให้สมองแข็งแรง อย่าลืมนอนให้พอนะ 🌙",
  "ลองวาดรูปหรืออ่านนิทานกับครอบครัวดูนะ 📖",
];

const rawToday = new Date().getDay();
const adjustedToday = rawToday === 0 ? 6 : rawToday - 1;
const DAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const TIME_EMOJI: Record<string, string>     = { เช้า: "☀️", บ่าย: "🌤️", เย็น: "🌙" };
const SKILL_TO_GAME: Record<string, string> = {
  ภาษา: "picture-quiz",
  การสื่อสาร: "flashcard",
  การเรียนรู้: "counting",
  สมาธิ: "matching",
  กล้ามเนื้อ: "sorting",
};
const TIME_GRADIENT: Record<string, string>  = {
  เช้า: "from-amber-400 to-orange-400",
  บ่าย: "from-sky-400 to-blue-500",
  เย็น: "from-indigo-400 to-purple-500",
};
const TIME_LABEL: Record<string, string> = {
  เช้า: "08:00 น.", บ่าย: "14:00 น.", เย็น: "19:00 น.",
};

const scoreConfig = [
  { key: "ภาษา",        icon: "💬", bg: "bg-emerald-50", border: "border-emerald-100", textColor: "text-emerald-600", barColor: "bg-emerald-400", color: "#10B981" },
  { key: "การสื่อสาร",  icon: "🤝", bg: "bg-blue-50",    border: "border-blue-100",    textColor: "text-blue-600",    barColor: "bg-blue-400",    color: "#3B82F6" },
  { key: "การเรียนรู้", icon: "🧠", bg: "bg-purple-50",  border: "border-purple-100",  textColor: "text-purple-600",  barColor: "bg-purple-400",  color: "#8B5CF6" },
  { key: "สมาธิ",       icon: "🎯", bg: "bg-orange-50",  border: "border-orange-100",  textColor: "text-orange-500",  barColor: "bg-orange-400",  color: "#F97316" },
  { key: "กล้ามเนื้อ",  icon: "💪", bg: "bg-pink-50",    border: "border-pink-100",    textColor: "text-pink-600",    barColor: "bg-pink-400",    color: "#EC4899" },
];

const FALLBACK_ACTS = [
  { emoji: "🧩", title: "เกมจับคู่ภาพ", desc: "พัฒนาการสังเกตและคำศัพท์", duration: "10 นาที", gradient: "from-purple-400 to-violet-500", aiPick: true  },
  { emoji: "📖", title: "นิทานเสียง",   desc: "พัฒนาการฟังและจินตนาการ",  duration: "10 นาที", gradient: "from-pink-400 to-rose-500",   aiPick: false },
  { emoji: "🃏", title: "บัตรคำศัพท์",  desc: "ฝึกจำคำและการพูด",         duration: "10 นาที", gradient: "from-blue-400 to-cyan-500",   aiPick: false },
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
    isPremium, kidoSettings,
  } = useProfile();

  const [dailyData, setDailyData] = useState<DailyData>({
    date: "", screenMinutes: 0, physicalMinutes: 0, readingMinutes: 0, parentMinutes: 0, completedMissions: [],
  });
  useEffect(() => { setDailyData(loadDailyData()); }, []);

  useEffect(() => {
    if (isLoaded && !childProfile) router.replace("/onboarding");
  }, [isLoaded, childProfile, router]);

  const todayKey = DAY_KEYS[adjustedToday] as DayKey;
  const todayActivities: PlanActivity[] = weeklyPlan ? ((weeklyPlan[todayKey] as PlanActivity[]) ?? []) : [];
  const scores = latestAssessment?.scores ?? null;
  const overall = latestAssessment?.overall ?? 0;

  // Count days this week where at least 1 plan activity is marked done
  const streakDays = weeklyPlan
    ? DAY_KEYS.filter((dk) =>
        ((weeklyPlan[dk as DayKey] as PlanActivity[]) ?? []).some((_, idx) => activityLog[`${dk}-${idx}`])
      ).length
    : 0;
  const level = getStreakLevel(streakDays);

  const limitMinutes = kidoSettings.dailyLimitMinutes || 60;
  const screenPct    = Math.min(100, (dailyData.screenMinutes / limitMinutes) * 100);
  const balanceScore = computeBalanceScore(dailyData);
  const todayMission = OFFLINE_MISSIONS.find((m) => !dailyData.completedMissions.includes(m.id)) ?? null;
  const kidoMsg      = KIDO_MESSAGES[Math.floor(Date.now() / 86400000) % KIDO_MESSAGES.length];

  const progressChange =
    assessmentHistory.length >= 2
      ? latestAssessment!.overall - assessmentHistory[assessmentHistory.length - 2].overall
      : null;

  // AI recommendation — based on weakest/strongest skill from real assessment
  const aiRec = (() => {
    if (!childProfile || !latestAssessment) return null;
    const sc = latestAssessment.scores as unknown as Record<string, number>;
    const sorted = Object.entries(sc).sort(([, a], [, b]) => a - b);
    const weakest = sorted[0][0];
    const strongest = sorted[sorted.length - 1][0];
    const todayAct = todayActivities[0]?.activity;
    return {
      text: todayAct
        ? `จากข้อมูลล่าสุด ${childProfile.name} มีพัฒนาการด้าน${strongest}ดีขึ้น 🎉 วันนี้แนะนำ "${todayAct}" เพื่อพัฒนาด้าน${weakest}ให้แข็งแกร่งขึ้น`
        : `จากข้อมูลล่าสุด ${childProfile.name} มีพัฒนาการด้าน${strongest}ดีขึ้น 🎉 วันนี้ AI แนะนำกิจกรรมที่จะช่วยพัฒนาด้าน${weakest}และคำศัพท์ใหม่`,
      weakest,
      strongest,
      href: "/dashboard/activities",
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

  // Incomplete today activities count → bell badge
  const incompleteTodayCount = todayActivities.filter((_, i) => !activityLog[`${todayKey}-${i}`]).length;

  const ACHIEVEMENTS = [
    { emoji: "🎤", title: "พูดคำใหม่ได้",     sub: "10 คำ",    earned: !!latestAssessment },
    { emoji: "🔥", title: "ฝึกครบ 7 วัน",    sub: "",         earned: streakDays >= 7 },
    { emoji: "🎯", title: "สมาธิดีขึ้น",     sub: "10 นาที",  earned: overall >= 60 },
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

        {/* ── Top Bar ── */}
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

          {/* Center: stat summary */}
          {childProfile && (
            <div className="hidden lg:flex flex-col gap-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl px-5 py-3.5 shrink-0 min-w-[300px]">
              <div className="font-bold text-sm text-gray-800">
                🎯 วันนี้{childProfile.name}ฝึกครบ {streakDays} วันต่อเนื่อง
              </div>
              {progressChange !== null && aiRec ? (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-green-500" />
                  📈 พัฒนาการด้าน{aiRec.strongest}ดีขึ้น{" "}
                  <span className="font-bold text-green-600">{progressChange >= 0 ? "+" : ""}{progressChange}%</span>
                </div>
              ) : progressChange !== null ? (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-green-500" />
                  📈 พัฒนาการโดยรวมเพิ่มขึ้น{" "}
                  <span className="font-bold text-green-600">{progressChange >= 0 ? "+" : ""}{progressChange}%</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> ทำแบบประเมินเพื่อติดตามพัฒนาการ
                </div>
              )}
              {todayActivities.length > 0 ? (
                <div className="text-xs text-green-700 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-green-500 fill-green-500" />
                  ✅ AI สร้างแผนฝึก {todayActivities.length} กิจกรรมวันนี้แล้ว
                </div>
              ) : weeklyPlan ? (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ⭐ มีแผนสัปดาห์นี้แล้ว ดูกิจกรรมวันอื่น →
                </div>
              ) : (
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-gray-300" />
                  💡 สร้างแผนฝึกเพื่อรับคำแนะนำจาก AI
                </div>
              )}
            </div>
          )}

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => incompleteTodayCount > 0 && toast(`มีกิจกรรมวันนี้อีก ${incompleteTodayCount} รายการที่ยังไม่เสร็จ 📋`)}
                className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              {incompleteTodayCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {incompleteTodayCount}
                </span>
              )}
            </div>
            <Link href="/dashboard/settings">
              <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-purple-200">
                <AvatarImage src={parentProfile?.avatarUrl} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
            <span className="hidden lg:block text-sm font-medium text-gray-700">{displayName}</span>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_310px] gap-5">

          {/* ═══ LEFT COLUMN ═══ */}
          <div className="space-y-5">

            {/* ── HERO: AI Coach Card ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 lg:p-8 shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_55%)]" />
              <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute top-2 right-4 pointer-events-none opacity-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kido-celebrate.png" alt="" className="w-32 h-32 object-contain select-none" />
              </div>

              <div className="relative flex flex-col lg:flex-row items-start gap-5">

                {/* AI Avatar */}
                <div className="shrink-0">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/kido-point.png" alt="Kido" className="w-full h-full object-contain scale-110" />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1 bg-green-400 rounded-full px-2 py-0.5 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] text-white font-bold">ออนไลน์</span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-white/60 text-[11px] font-semibold">Kido AI</span>
                  </div>
                </div>

                {/* Message bubble */}
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-white/90 text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> แนะนำสำหรับวันนี้
                  </div>

                  {aiRec && childProfile ? (
                    <div className="space-y-1.5">
                      <p className="text-white font-bold text-base lg:text-lg leading-snug">
                        จากข้อมูลล่าสุด {childProfile.name} มีพัฒนาการด้าน{aiRec.strongest}ดีขึ้น
                        {progressChange !== null && (
                          <span className="text-green-300 ml-1">{progressChange >= 0 ? "+" : ""}{progressChange}%</span>
                        )} 🎉
                      </p>
                      <p className="text-white/80 text-sm lg:text-base leading-relaxed">
                        {todayActivities[0]
                          ? `วันนี้แนะนำ "${todayActivities[0].activity}" ${todayActivities[0].duration} เพื่อพัฒนาด้าน${aiRec.weakest}ให้แข็งแกร่งขึ้นค่ะ`
                          : `วันนี้แนะนำกิจกรรมฝึกด้าน${aiRec.weakest}เพื่อพัฒนาทักษะที่ยังต้องการความช่วยเหลือค่ะ`}
                      </p>
                    </div>
                  ) : childProfile ? (
                    <div className="space-y-1.5">
                      <p className="text-white font-bold text-base lg:text-lg leading-snug">
                        สวัสดีค่ะ! AI ยังรอข้อมูลพัฒนาการของ{childProfile.name}อยู่ค่ะ 🌟
                      </p>
                      <p className="text-white/80 text-sm leading-relaxed">
                        ทำแบบประเมินเพียง 3 นาที AI จะวิเคราะห์และสร้างแผนฝึกเฉพาะตัวให้ทันทีค่ะ ✨
                      </p>
                    </div>
                  ) : (
                    <p className="text-white text-base leading-relaxed">
                      สวัสดีค่ะ! เริ่มต้นด้วยการตั้งค่าข้อมูลเด็กเพื่อรับคำแนะนำจาก AI ค่ะ
                    </p>
                  )}

                  {/* Quick info chips */}
                  {aiRec && todayActivities[0] && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-white text-xs font-medium">
                        🎯 {todayActivities[0].activity}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-white text-xs font-medium">
                        ⏱ {todayActivities[0].duration}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-white text-xs font-medium">
                        📈 ด้าน{aiRec.weakest}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                  <Link
                    href={
                      aiRec
                        ? `/dashboard/activities?game=${SKILL_TO_GAME[aiRec.weakest] ?? "matching"}`
                        : "/dashboard/assessment"
                    }
                    className="flex-1 lg:flex-none"
                  >
                    <button className="w-full lg:w-44 bg-white text-purple-700 font-bold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-md">
                      <Sparkles className="w-4 h-4" />
                      {aiRec ? "เริ่มกิจกรรม" : "ประเมินลูกเลย"}
                    </button>
                  </Link>
                  <Link href="/dashboard/ai-coach" className="flex-1 lg:flex-none">
                    <button className="w-full lg:w-44 bg-white/20 text-white font-semibold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/30 transition-colors border border-white/30">
                      <Mic className="w-4 h-4" /> พูดคุยกับ AI
                    </button>
                  </Link>
                  <Link href="/dashboard/kido" className="flex-1 lg:flex-none">
                    <button className="w-full lg:w-44 bg-amber-400/20 text-amber-200 font-semibold text-sm px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-400/30 transition-colors border border-amber-300/30">
                      🤖 Kido – AI Buddy ของลูก
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Kido Healthy Screen Time™ ── */}
            {childProfile && (
              <div className="rounded-3xl overflow-hidden border border-purple-100 shadow-sm bg-white">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/kido-point.png" alt="Kido" className="w-9 h-9 object-contain" />
                    <div>
                      <div className="text-white font-black text-sm">Kido Healthy Screen Time™</div>
                      <div className="text-white/60 text-[10px]">ระบบดูแลเวลาใช้งานอัจฉริยะ</div>
                    </div>
                  </div>
                  <span className="bg-amber-400 text-gray-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">✨ PREMIUM</span>
                </div>

                {/* Top row: Screen Time | Daily Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

                  {/* Screen Time */}
                  <div className="p-4 flex flex-col items-center text-center">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-2 h-2 rounded-full ${dailyData.screenMinutes < 25 ? "bg-green-400" : "bg-amber-400"}`} />
                      <span className={`text-xs font-bold ${dailyData.screenMinutes < 25 ? "text-green-600" : "text-amber-600"}`}>
                        {dailyData.screenMinutes < 25 ? "ปลอดภัย" : "ใกล้ถึงเวลาพัก"}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl font-black text-gray-900">{dailyData.screenMinutes}</span>
                      <span className="text-gray-400 text-sm font-semibold mb-1">/{limitMinutes} นาที</span>
                    </div>
                    <div className="w-full max-w-[160px] h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${screenPct}%`, background: screenPct < 60 ? "#10B981" : screenPct < 85 ? "#F59E0B" : "#EF4444" }} />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/kido-sleep.png" alt="Kido" className="w-16 h-16 object-contain my-1" />
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {dailyData.screenMinutes < 15
                        ? "Kido แนะนำพักหลังเล่นครบ 15 นาที 😊"
                        : dailyData.screenMinutes < 30
                        ? "Kido แนะนำพักหน่อยแล้วเล่นต่อนะ 🔔"
                        : "ถึงเวลาพักตาสักหน่อยแล้ว! 😴"}
                    </p>
                    <Link href="/dashboard/kido" className="mt-3 w-full max-w-[160px]">
                      <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold py-2.5 rounded-xl active:scale-95 transition-transform">
                        เล่นกับ Kido →
                      </button>
                    </Link>
                  </div>

                  {/* Daily Balance */}
                  <div className="p-4">
                    {isPremium ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-gray-700">⚖️ Daily Balance</span>
                          <div className="relative w-14 h-14">
                            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8B5CF6" strokeWidth="4"
                                strokeDasharray={`${balanceScore} ${100 - balanceScore}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[11px] font-black text-gray-900">{balanceScore}</span>
                              <span className="text-[7px] text-gray-400 leading-none">/100</span>
                            </div>
                          </div>
                        </div>
                        {([
                          { icon: "📱", label: "Screen Time", minutes: dailyData.screenMinutes, max: 60,  color: "#3B82F6" },
                          { icon: "🏃", label: "Physical",    minutes: dailyData.physicalMinutes, max: 15, color: "#10B981" },
                          { icon: "📖", label: "Learning",    minutes: dailyData.readingMinutes,  max: 10, color: "#8B5CF6" },
                          { icon: "👨‍👩‍👧", label: "Family",    minutes: dailyData.parentMinutes,  max: 10, color: "#F59E0B" },
                        ] as const).map((m) => (
                          <div key={m.label} className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs w-5 shrink-0">{m.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                                <span>{m.label}</span>
                                <span>{m.minutes} นาที</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, (m.minutes / m.max) * 100)}%`, backgroundColor: m.color }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-6">
                        <div className="text-3xl mb-2">🔒</div>
                        <div className="font-bold text-gray-700 text-sm mb-1">Daily Balance</div>
                        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                          ติดตาม 4 มิติพัฒนาการ<br />ของลูกแบบ Real-time
                        </p>
                        <Link href="/dashboard/settings?tab=billing">
                          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform">
                            อัปเกรด Premium
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: Mission | Kido Message */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-t border-gray-100">

                  {/* ภารกิจแนะนำวันนี้ */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-700">🎯 ภารกิจแนะนำวันนี้</span>
                      {todayMission && (
                        <span className="text-[10px] text-purple-500 font-semibold">+{todayMission.minutes} นาที ⭐</span>
                      )}
                    </div>
                    {todayMission ? (
                      <div className="flex items-center gap-3 bg-purple-50 rounded-2xl p-3">
                        <span className="text-2xl">{todayMission.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{todayMission.title}</p>
                          <p className="text-[10px] text-gray-400">
                            {todayMission.category === "physical" ? "ออกกำลังกาย" : todayMission.category === "parent" ? "เวลากับครอบครัว" : "การเรียนรู้"}
                          </p>
                        </div>
                        <Link href="/dashboard/kido">
                          <button className="shrink-0 bg-purple-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl">
                            เริ่ม
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="bg-green-50 rounded-2xl p-3 text-center">
                        <div className="text-xl mb-0.5">🎉</div>
                        <p className="text-xs font-semibold text-green-700">ทำภารกิจครบทุกอย่างแล้ว!</p>
                      </div>
                    )}
                  </div>

                  {/* ข้อความจาก Kido */}
                  <div className="p-4">
                    <div className="text-xs font-bold text-gray-700 mb-2">💬 ข้อความจาก Kido</div>
                    <div className="flex items-start gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain shrink-0" />
                      <div className="bg-indigo-50 rounded-2xl rounded-tl-sm px-3 py-2.5 flex-1">
                        <p className="text-xs text-gray-700 leading-relaxed">{kidoMsg}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      <Link key={s.key} href="/dashboard/progress">
                        <div className={`${s.bg} border ${s.border} rounded-2xl p-3.5 text-center cursor-pointer hover:shadow-md transition-shadow`}>
                          <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shadow-sm mx-auto mb-2`}>
                            <span className="text-2xl">{s.icon}</span>
                          </div>
                          <div className="text-xs text-gray-500 font-semibold mb-0.5">{s.key}</div>
                          <div className={`text-2xl font-black ${s.textColor} leading-none`}>{score}<span className="text-xs font-semibold text-gray-400">/100</span></div>
                          <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden my-2">
                            <div className={`h-full ${s.barColor} rounded-full transition-all`} style={{ width: `${score}%` }} />
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </div>
                          <div className="text-[9px] text-gray-400 mt-1">ดีกว่าเด็กวัยเดียวกัน {pct}%</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Middle 2-col: Assessment CTA | Streak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Assessment CTA */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white flex flex-col items-center text-center justify-between">
                <div className="w-full">
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
                    {streakDays >= 7 ? "เก่งมาก! รักษาฟอร์มให้ดีนะ 👏"
                      : streakDays > 0 ? "ต่อเนื่องอีกนะคะ 💪"
                      : "เริ่มฝึกวันนี้เลยนะคะ!"}
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {DAY_LABELS.map((label, i) => {
                      const dk = DAY_KEYS[i] as DayKey;
                      const acts = weeklyPlan ? ((weeklyPlan[dk] as PlanActivity[]) ?? []) : [];
                      const done = acts.length > 0 && acts.every((_, idx) => activityLog[`${dk}-${idx}`]);
                      const partial = !done && acts.some((_, idx) => activityLog[`${dk}-${idx}`]);
                      const isToday = i === adjustedToday;
                      return (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                          <div className={`w-full aspect-square rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            done    ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm text-white"
                            : partial ? "bg-orange-200 text-orange-600"
                            : isToday ? "bg-white border-2 border-orange-400 text-orange-500"
                            : "bg-white border border-orange-200 text-gray-300"
                          }`}>
                            {done ? "✓" : partial ? "·" : isToday ? "★" : ""}
                          </div>
                          <span className="text-[8px] text-gray-400 font-medium">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* Bottom 3-col: Today Activities | Chart | Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Today's Activities (real plan data or fallback) */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900 text-sm">
                      {todayActivities.length > 0 ? "แผนการฝึกวันนี้" : "กิจกรรมแนะนำ"}
                    </h2>
                    {todayActivities.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        เสร็จแล้ว {todayActivities.filter((_, i) => activityLog[`${todayKey}-${i}`]).length}/{todayActivities.length} กิจกรรม
                      </p>
                    )}
                  </div>
                  <Link href="/dashboard/activities">
                    <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5">ดูทั้งหมด <ChevronRight className="w-3 h-3" /></span>
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  {todayActivities.length > 0 ? (
                    todayActivities.map((item, i) => {
                      const key = `${todayKey}-${i}`;
                      const isDone = activityLog[key] ?? false;
                      const gradient = TIME_GRADIENT[item.time] ?? "from-gray-400 to-gray-500";
                      const emoji = TIME_EMOJI[item.time] ?? "🌟";
                      const timeLabel = TIME_LABEL[item.time] ?? "";
                      return (
                        <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-opacity ${isDone ? "opacity-50" : ""}`}>
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                            <span className="text-2xl">{emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold text-gray-800 truncate ${isDone ? "line-through text-gray-400" : ""}`}>
                              {item.activity}
                            </div>
                            <div className="text-[10px] text-gray-400">{timeLabel} · {item.duration}</div>
                          </div>
                          <button
                            onClick={() => toggleActivity(key)}
                            className="shrink-0 p-1 hover:scale-110 transition-transform"
                          >
                            {isDone
                              ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                              : <Circle className="w-6 h-6 text-gray-300 hover:text-green-400 transition-colors" />
                            }
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    FALLBACK_ACTS.map((act) => (
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
                          <p className="text-[10px] text-gray-400">{act.desc} · {act.duration}</p>
                        </div>
                        <Link href="/dashboard/activities">
                          <button className="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                            เริ่มเลย
                          </button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>

                {/* Progress bar for today */}
                {todayActivities.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>ความคืบหน้าวันนี้</span>
                      <span>{Math.round((todayActivities.filter((_, i) => activityLog[`${todayKey}-${i}`]).length / todayActivities.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${(todayActivities.filter((_, i) => activityLog[`${todayKey}-${i}`]).length / todayActivities.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
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
                  <div className="h-[180px] flex flex-col items-center justify-center gap-3 text-center">
                    <p className="text-gray-400 text-xs">ยังไม่มีข้อมูล<br />ทำแบบประเมินก่อน</p>
                    <Link href="/dashboard/assessment">
                      <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl text-xs">
                        เริ่มประเมิน
                      </Button>
                    </Link>
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
                <h2 className="font-bold text-gray-900 text-sm mb-3">ความก้าวหน้าโดยรวม</h2>
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
                      <span className="text-[8px] text-gray-400 text-center">ผลประเมินล่าสุด</span>
                    </div>
                  </div>
                </div>
                {progressChange !== null && (
                  <p className="text-xs text-green-600 font-semibold text-center mb-2">
                    เพิ่มขึ้น {progressChange >= 0 ? "+" : ""}{progressChange}% จากเดือนที่แล้ว 🚀
                  </p>
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
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/kido-point.png" alt="Kido" className="w-full h-full object-contain scale-110" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold">Kido AI Coach</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-blue-100 text-xs">พร้อมช่วยเสมอ</span>
                    </div>
                  </div>
                </div>
              </div>

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
                  { label: "แนะนำกิจกรรม",  color: "bg-purple-50 border-purple-100 text-purple-700" },
                  { label: "พัฒนาการวันนี้", color: "bg-blue-50 border-blue-100 text-blue-700" },
                  { label: "พฤติกรรม",       color: "bg-amber-50 border-amber-100 text-amber-700" },
                  { label: "โภชนาการ",       color: "bg-green-50 border-green-100 text-green-700" },
                ].map((chip) => (
                  <Link key={chip.label} href={`/dashboard/ai-coach?q=${encodeURIComponent(chip.label)}`}>
                    <button className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl border transition-opacity hover:opacity-70 ${chip.color}`}>
                      {chip.label}
                    </button>
                  </Link>
                ))}
              </div>

              {/* Big CTA */}
              <div className="px-4 pb-3">
                <Link href="/dashboard/ai-coach">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                    <Mic className="w-4 h-4" /> พูดคุยกับ AI Coach
                  </button>
                </Link>
              </div>

              {/* 3 action buttons */}
              <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => toast("ฟีเจอร์ส่งคลิป/รูป กำลังพัฒนาอยู่ค่ะ 🚧")}
                  className="flex flex-col items-center gap-1 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] text-gray-500 font-medium">ส่งคลิป/รูป</span>
                </button>
                <Link href="/dashboard/progress">
                  <button className="w-full flex flex-col items-center gap-1 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span className="text-[10px] text-gray-500 font-medium">ดูรายงาน</span>
                  </button>
                </Link>
                <button
                  onClick={() => toast("ฟีเจอร์โหมดเสียง กำลังพัฒนาอยู่ค่ะ 🚧")}
                  className="flex flex-col items-center gap-1 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] text-gray-500 font-medium">โหมดเสียง</span>
                </button>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatInput.trim()) {
                        router.push(`/dashboard/ai-coach?q=${encodeURIComponent(chatInput.trim())}`);
                      }
                    }}
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
                <span className="text-blue-600 text-xs font-medium cursor-pointer flex items-center gap-0.5">
                  ดูทั้งหมด <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="space-y-2">
                {incompleteTodayCount > 0 && (
                  <div className="flex items-center gap-2.5 py-1 bg-purple-50 rounded-xl px-2">
                    <div className="w-7 h-7 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 text-sm">📋</div>
                    <div className="flex-1 min-w-0 text-xs text-purple-700 font-medium truncate">
                      มีกิจกรรมวันนี้อีก {incompleteTodayCount} รายการ
                    </div>
                    <Link href="/dashboard/plan">
                      <span className="text-[10px] text-purple-600 font-bold shrink-0">ดู</span>
                    </Link>
                  </div>
                )}
                {[
                  { emoji: "🔔", label: "ถึงเวลาฝึกกิจกรรมตอนเย็น",   time: "19:00",   color: "bg-purple-50" },
                  { emoji: "📋", label: "บันทึกผลการฝึกประจำวัน",     time: "20:00",   color: "bg-blue-50" },
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

            {/* Achievements */}
            <Card className="p-4 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 text-sm">ความสำเร็จล่าสุด</h2>
                <Link href="/dashboard/progress">
                  <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5">ดูทั้งหมด <ChevronRight className="w-3 h-3" /></span>
                </Link>
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
