"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { DAY_KEYS } from "@/lib/profile-utils";
import type { DayKey, PlanActivity } from "@/lib/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Bell, ChevronRight, CheckCircle2, Circle, Sun, Cloud, Moon, Play,
  Send, Bot, Star, Trophy, TrendingUp, Info, Calendar, Loader2, Sparkles,
} from "lucide-react";

const rawToday = new Date().getDay();
const adjustedToday = rawToday === 0 ? 6 : rawToday - 1;

const scoreConfig = [
  { key: "ภาษา",       icon: "💬", bg: "bg-emerald-50", border: "border-emerald-100", textColor: "text-emerald-600", barColor: "bg-emerald-400", color: "#10B981" },
  { key: "การสื่อสาร", icon: "🤝", bg: "bg-blue-50",    border: "border-blue-100",    textColor: "text-blue-600",    barColor: "bg-blue-400",    color: "#3B82F6" },
  { key: "การเรียนรู้", icon: "🧠", bg: "bg-purple-50",  border: "border-purple-100",  textColor: "text-purple-600",  barColor: "bg-purple-400",  color: "#8B5CF6" },
  { key: "สมาธิ",      icon: "🎯", bg: "bg-orange-50",  border: "border-orange-100",  textColor: "text-orange-500",  barColor: "bg-orange-400",  color: "#F97316" },
  { key: "กล้ามเนื้อ", icon: "💪", bg: "bg-pink-50",    border: "border-pink-100",    textColor: "text-pink-600",    barColor: "bg-pink-400",    color: "#EC4899" },
];

const timeIcons: Record<string, React.ElementType> = { เช้า: Sun, บ่าย: Cloud, เย็น: Moon };
const timeColors: Record<string, { bg: string; border: string; iconColor: string; time: string }> = {
  เช้า: { bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500", time: "08:00 - 08:15" },
  บ่าย: { bg: "bg-sky-50",   border: "border-sky-100",   iconColor: "text-sky-400",   time: "14:00 - 14:15" },
  เย็น: { bg: "bg-indigo-50",border: "border-indigo-100",iconColor: "text-indigo-500",time: "19:00 - 19:15" },
};

function getScoreStatus(score: number) {
  if (score >= 75) return "ดี";
  if (score >= 50) return "พอใช้";
  return "ควรฝึกต่อ";
}

export default function DashboardPage() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const { isLoaded, childProfile, childAge, displayName, latestAssessment, weeklyPlan, activityLog, toggleActivity } = useProfile();

  // Redirect new users to onboarding
  useEffect(() => {
    if (isLoaded && !childProfile) {
      router.replace("/onboarding");
    }
  }, [isLoaded, childProfile, router]);

  const todayDate = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

  // Today's activities from the weekly plan
  const todayKey = DAY_KEYS[adjustedToday] as DayKey;
  const todayActivities: PlanActivity[] = weeklyPlan ? ((weeklyPlan[todayKey] as PlanActivity[]) ?? []) : [];

  // Scores — use real assessment if available, else zeros
  const scores = latestAssessment?.scores ?? null;

  // Build a simple progress chart from the latest assessment (just one data point for now)
  const chartData = latestAssessment
    ? [{ month: new Date(latestAssessment.date).toLocaleDateString("th-TH", { month: "short" }), ...latestAssessment.scores }]
    : [];

  const overall = latestAssessment?.overall ?? 0;

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

        {/* Setup Banner */}
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

        {/* Top Bar */}
        <div className="flex items-start justify-between mb-6 pl-12 lg:pl-0">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full ring-4 ring-pink-200 ring-offset-2 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center shadow-lg overflow-hidden">
                {childProfile?.avatar?.startsWith("http") ? (
                  <Image
                    src={childProfile.avatar}
                    alt={childProfile.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl select-none">
                    {childProfile?.gender === "ชาย" ? "👦" : "👧"}
                  </span>
                )}
              </div>
              {childProfile && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-xs">✓</span>
              )}
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">สวัสดีค่ะ {displayName} 👋</h1>
              <p className="text-base lg:text-lg font-semibold text-gray-700 mt-0.5">
                {childProfile ? `วันนี้มาฝึก${childProfile.name}กันเถอะ! 💗` : "เริ่มต้นใช้งาน KidCoach AI 💗"}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {childProfile && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {childProfile.name}
                  </Badge>
                )}
                {childAge && <span className="text-sm text-gray-500">อายุ {childAge}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-purple-200">
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
                    const status = getScoreStatus(score);
                    return (
                      <div key={s.key} className={`${s.bg} border ${s.border} rounded-2xl p-3.5 text-center`}>
                        <div className="flex justify-center mb-2">
                          <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shadow-sm`}>
                            <span className="text-2xl">{s.icon}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mb-1">{s.key}</div>
                        <div className={`text-3xl font-black ${s.textColor} leading-none mb-0.5`}>{score}</div>
                        <div className="text-[10px] text-gray-400 mb-2.5">คะแนน</div>
                        <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                          <div className={`h-full ${s.barColor} rounded-full`} style={{ width: `${score}%` }} />
                        </div>
                        <div className={`text-[11px] font-bold mt-1.5 ${s.textColor}`}>{status}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Today Plan + Activities */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Today's Plan */}
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
                    <p className="text-gray-400 text-sm mb-3">
                      {weeklyPlan ? "วันหยุด 😊" : "ยังไม่มีแผนการฝึก"}
                    </p>
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

              {/* Recommended Activities */}
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
                    { title: "บัตรคำศัพท์", duration: "10 นาที", gradient: "from-sky-400 to-blue-500", emoji: "🃏", bg: "bg-blue-50" },
                    { title: "นิทานสั้น", duration: "10 นาที", gradient: "from-pink-400 to-rose-500", emoji: "📖", bg: "bg-pink-50" },
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

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">กราฟพัฒนาการ</h2>
                  <Link href="/dashboard/progress">
                    <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">ดูรายงาน <TrendingUp className="w-3 h-3" /></span>
                  </Link>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">ยังไม่มีข้อมูล — ทำแบบประเมินก่อน</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {scoreConfig.map((s) => (
                        <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

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
                  <div>
                    <div className="text-white font-bold">AI Coach</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-blue-100 text-xs">พร้อมช่วยเสมอ</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50/70">
                <div className="bg-white text-gray-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm border border-gray-100">
                  {childProfile
                    ? `สวัสดีค่ะ! วันนี้มีอะไรจะถามเกี่ยวกับ${childProfile.name}ไหมคะ? 😊`
                    : "สวัสดีค่ะ! ฉันคือ AI Coach ผู้ช่วยฝึกพัฒนาการเด็ก มีอะไรให้ช่วยไหมคะ? 😊"}
                </div>
              </div>
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <Link href="/dashboard/plan">
                  <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 rounded-xl text-xs font-semibold">
                    <Play className="w-3 h-3 mr-1.5 fill-white" />
                    ดูแผนการฝึกเต็มรูปแบบ
                  </Button>
                </Link>
              </div>
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
            <Card className="p-5 shadow-sm border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">การแจ้งเตือน</h2>
                <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5 cursor-pointer">
                  ดูทั้งหมด <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Bell, label: "ถึงเวลาฝึกกิจกรรมตอนเย็น", time: "19:00", color: "text-purple-500", bg: "bg-purple-50" },
                  { icon: Calendar, label: "บันทึกผลการฝึกประจำวัน", time: "20:00", color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Star, label: "ประเมินพัฒนาการประจำสัปดาห์", time: "พรุ่งนี้", color: "text-amber-500", bg: "bg-amber-50" },
                ].map((n, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className={`w-8 h-8 ${n.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <n.icon className={`w-4 h-4 ${n.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 leading-relaxed">{n.label}</div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0 font-medium">{n.time}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Achievement */}
            <Card className="p-4 shadow-sm border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex items-start gap-3">
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm">
                    {childProfile ? `เก่งมากเลย ${childProfile.name}! 💗` : "เริ่มต้นเลย! 💗"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 mb-2.5">
                    {weeklyPlan ? "มีแผนฝึกแล้ว — ลงมือทำเลย!" : "ทำแบบประเมินเพื่อรับแผนฝึก"}
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const dk = DAY_KEYS[i] as DayKey;
                      const acts = weeklyPlan ? ((weeklyPlan[dk] as PlanActivity[]) ?? []) : [];
                      const hasDone = acts.some((_, idx) => activityLog[`${dk}-${idx}`]);
                      return (
                        <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center ${hasDone ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gray-200"}`}>
                          {hasDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-3xl">🎁</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
