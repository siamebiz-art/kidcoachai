"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Bell,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sun,
  Cloud,
  Moon,
  Play,
  Send,
  Bot,
  Star,
  Trophy,
  TrendingUp,
  Info,
  Calendar,
} from "lucide-react";

const progressData = [
  { month: "ม.ค.", ภาษา: 55, การสื่อสาร: 50, การเรียนรู้: 65, สมาธิ: 40, กล้ามเนื้อ: 60 },
  { month: "ก.พ.", ภาษา: 58, การสื่อสาร: 53, การเรียนรู้: 68, สมาธิ: 43, กล้ามเนื้อ: 63 },
  { month: "มี.ค.", ภาษา: 62, การสื่อสาร: 57, การเรียนรู้: 72, สมาธิ: 47, กล้ามเนื้อ: 66 },
  { month: "เม.ย.", ภาษา: 66, การสื่อสาร: 62, การเรียนรู้: 75, สมาธิ: 52, กล้ามเนื้อ: 69 },
  { month: "พ.ค.", ภาษา: 72, การสื่อสาร: 68, การเรียนรู้: 80, สมาธิ: 60, กล้ามเนื้อ: 75 },
];

const scores = [
  {
    label: "ภาษา",
    score: 72,
    color: "#10B981",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    textColor: "text-emerald-600",
    barColor: "bg-emerald-400",
    status: "พอใช้",
    statusColor: "text-emerald-600",
    icon: "💬",
  },
  {
    label: "การสื่อสาร",
    score: 68,
    color: "#3B82F6",
    bg: "bg-blue-50",
    border: "border-blue-100",
    textColor: "text-blue-600",
    barColor: "bg-blue-400",
    status: "พอใช้",
    statusColor: "text-blue-600",
    icon: "🤝",
  },
  {
    label: "การเรียนรู้",
    score: 80,
    color: "#8B5CF6",
    bg: "bg-purple-50",
    border: "border-purple-100",
    textColor: "text-purple-600",
    barColor: "bg-purple-400",
    status: "ดี",
    statusColor: "text-purple-600",
    icon: "🧠",
  },
  {
    label: "สมาธิ",
    score: 60,
    color: "#F97316",
    bg: "bg-orange-50",
    border: "border-orange-100",
    textColor: "text-orange-500",
    barColor: "bg-orange-400",
    status: "ควรฝึกต่อ",
    statusColor: "text-orange-500",
    icon: "🎯",
  },
  {
    label: "กล้ามเนื้อ",
    score: 75,
    color: "#EC4899",
    bg: "bg-pink-50",
    border: "border-pink-100",
    textColor: "text-pink-600",
    barColor: "bg-pink-400",
    status: "พอใช้",
    statusColor: "text-pink-600",
    icon: "💪",
  },
];

const todayPlan = [
  {
    time: "08:00 - 08:15",
    session: "เช้า",
    activity: "ฝึกคำศัพท์จากภาพ",
    duration: "5-10 นาที",
    done: true,
    Icon: Sun,
    iconColor: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    time: "14:00 - 14:15",
    session: "บ่าย",
    activity: "เกมจับคู่ภาพเหมือน",
    duration: "10 นาที",
    done: false,
    Icon: Cloud,
    iconColor: "text-sky-400",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
  {
    time: "19:00 - 19:15",
    session: "เย็น",
    activity: "เล่านิทานก่อนนอน",
    duration: "10 นาที",
    done: false,
    Icon: Moon,
    iconColor: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
];

const recommendedActivities = [
  {
    title: "เกมชี้รูปภาพ",
    duration: "10+ นาที",
    gradient: "from-orange-400 to-amber-400",
    emoji: "👆",
    bg: "bg-amber-50",
  },
  {
    title: "บัตรคำศัพท์",
    duration: "10 นาที",
    gradient: "from-sky-400 to-blue-500",
    emoji: "🃏",
    bg: "bg-blue-50",
  },
  {
    title: "นิทานพัฒนาภาษา",
    duration: "10 นาที",
    gradient: "from-pink-400 to-rose-500",
    emoji: "📖",
    bg: "bg-pink-50",
  },
];

const notifications = [
  {
    icon: Bell,
    label: "ถึงเวลาฝึกกิจกรรมตอนเย็น",
    time: "19:00",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: Calendar,
    label: "บันทึกผลการฝึกประจำวัน",
    time: "20:00",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Star,
    label: "ประเมินพัฒนาการประจำสัปดาห์",
    time: "พรุ่งนี้ 09:00",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

const aiMessages = [
  {
    role: "user",
    content: "ลูก 4 ขวบ พูดได้แค่ 20 คำ ควรฝึกอะไรดีคะ?",
  },
  {
    role: "ai",
    content:
      "จากข้อมูลของคุณแม่บอกนะคะ วันนี้แนะนำฝึก 3 กิจกรรมนี้ค่ะ 😊\n\n🎮 1. เกมชี้รูปภาพ 10 นาที\nฝึกการเรียกชื่อสิ่งของ\n\n🗣️ 2. ฝึกคำศัพท์ในชีวิตประจำวัน 10 นาที\nเช่น กิน นอน อาบน้ำ\n\n📖 3. เล่านิทานสั้นๆ 10 นาที\nช่วยพัฒนาภาษาและสมาธิ",
  },
];

export default function DashboardPage() {
  const [chatInput, setChatInput] = useState("");

  const todayDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30">
      <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">

        {/* Top Bar */}
        <div className="flex items-start justify-between mb-6 pl-12 lg:pl-0">
          <div className="flex items-center gap-4">
            {/* Child photo — larger */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full ring-4 ring-pink-200 ring-offset-2 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center shadow-lg">
                <span className="text-4xl select-none">👧</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-xs">✓</span>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                สวัสดีค่ะ คุณแม่ 👋
              </h1>
              <p className="text-base lg:text-lg font-semibold text-gray-700 mt-0.5">
                วันนี้มาฝึกน้องนุ่นกันเถอะ! 💗
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  น้องนุ่น
                </Badge>
                <span className="text-sm text-gray-500">อายุ 4 ปี 2 เดือน</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-4xl select-none" style={{ animation: "spin 12s linear infinite" }}>
              🌤️
            </div>

            {/* Bell */}
            <div className="relative">
              <button className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </div>

            <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-purple-200">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                แม่
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-sm font-medium text-gray-700">
              คุณแม่ก้อย
            </span>
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
                  <Info className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
                </h2>
                <Link href="/dashboard/progress">
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5 hover:text-blue-700">
                    ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {scores.map((s) => (
                  <div key={s.label}
                    className={`${s.bg} border ${s.border} rounded-2xl p-3.5 text-center`}>
                    {/* Icon with colored bubble */}
                    <div className="flex justify-center mb-2">
                      <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center shadow-sm`}
                        style={{ filter: "saturate(1.2)" }}>
                        <span className="text-2xl">{s.icon}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">{s.label}</div>
                    <div className={`text-3xl font-black ${s.textColor} leading-none mb-0.5`}>
                      {s.score}
                    </div>
                    <div className="text-[10px] text-gray-400 mb-2.5">คะแนน</div>
                    <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                      <div className={`h-full ${s.barColor} rounded-full transition-all`}
                        style={{ width: `${s.score}%` }} />
                    </div>
                    <div className={`text-[11px] font-bold mt-1.5 ${s.statusColor}`}>
                      {s.status}
                    </div>
                  </div>
                ))}
              </div>
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
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5">
                      ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                    </span>
                  </Link>
                </div>

                <div className="space-y-2.5 flex-1">
                  {todayPlan.map((item) => (
                    <div
                      key={item.time}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${item.bg} ${item.border}`}
                    >
                      <item.Icon className={`w-5 h-5 ${item.iconColor} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-gray-400 font-medium">{item.time}</div>
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {item.activity}
                        </div>
                        <div className="text-xs text-gray-400">{item.duration}</div>
                      </div>
                      {item.done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

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
                  <h2 className="font-bold text-gray-900">กิจกรรมแนะนำสำหรับวันนี้</h2>
                  <Link href="/dashboard/activities">
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-0.5">
                      ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                    </span>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {recommendedActivities.map((act) => (
                    <Link href="/dashboard/activities" key={act.title}>
                      <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                        {/* Activity illustration area */}
                        <div
                          className={`h-24 bg-gradient-to-br ${act.gradient} flex items-center justify-center`}
                        >
                          <span className="text-4xl">{act.emoji}</span>
                        </div>
                        {/* Info */}
                        <div className={`${act.bg} px-2.5 py-2`}>
                          <div className="text-xs font-semibold text-gray-800 leading-tight">
                            {act.title}
                          </div>
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
              {/* Progress Line Chart */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">กราฟพัฒนาการ</h2>
                  <Link href="/dashboard/progress">
                    <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">
                      ดูรายงานแบบละเอียด <TrendingUp className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="ภาษา" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="การสื่อสาร" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="การเรียนรู้" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="สมาธิ" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="กล้ามเนื้อ" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Overall Progress */}
              <Card className="p-5 shadow-sm border-gray-100 bg-white">
                <h2 className="font-bold text-gray-900 mb-4">ความก้าวหน้าโดยรวม</h2>

                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke="url(#pGrad)" strokeWidth="3"
                        strokeDasharray="68 32"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-900">68%</span>
                      <span className="text-[9px] text-gray-400 text-center leading-tight px-2">
                        ดีขึ้นจากสัปดาห์ที่แล้ว
                      </span>
                      <span className="text-xs font-bold text-green-500 mt-0.5">+12% ↑</span>
                    </div>
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-gray-900 text-sm">เก่งมากเลยคุณแม่! 💗</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">ฝึกต่อเนื่อง 7 วันติด</p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="space-y-5">
            {/* AI Coach Chat */}
            <Card className="overflow-hidden shadow-sm border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <div className="text-white font-bold">AI Coach</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-blue-100 text-xs">พร้อมช่วยเสมอ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto bg-gray-50/70">
                {aiMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                      }`}
                    >
                      {msg.content}
                      <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-purple-200" : "text-gray-400"}`}>
                        10:30
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Full Plan button */}
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <Link href="/dashboard/plan">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 rounded-xl text-xs font-semibold"
                  >
                    <Play className="w-3 h-3 mr-1.5 fill-white" />
                    ดูแผนการฝึกเต็มรูปแบบ
                  </Button>
                </Link>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  />
                  <Link href="/dashboard/ai-coach">
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
                {notifications.map((n, i) => (
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
                  <div className="font-bold text-gray-900 text-sm">เก่งมากเลยคุณแม่! 💗</div>
                  <div className="text-xs text-gray-500 mt-0.5 mb-2.5">ฝึกต่อเนื่อง 7 วันติด</div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-3xl">🎁</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
