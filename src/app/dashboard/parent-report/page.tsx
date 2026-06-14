"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import {
  loadDailyData, computeBalanceScore, OFFLINE_MISSIONS, loadDailyHistory,
  type DailyData, type DayHistory,
} from "@/lib/daily-data";
import { ChevronLeft, Clock, Star, Trophy, BarChart3, Heart, BookOpen, Smile, Shield, Flame } from "lucide-react";

// ── localStorage keys ─────────────────────────────────────────────────────────
const SESSIONS_KEY   = "kidocoachai-sessions";
const LEARNING_KEY   = "kidocoachai-learning";
const LIFESKILLS_KEY = "kidocoachai-lifeskills";
const EMOTIONS_KEY   = "kidocoachai-emotions";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LocalSession  { gameName: string; score: number; total: number; accuracy: number; date: string }
interface LearningLog   { date: string; subject: string; minutes: number }
interface EmotionLog    { date: string; emotion: string; timestamp: number }

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECT_LABEL: Record<string, string> = {
  thai: "ภาษาไทย", english: "ภาษาอังกฤษ", math: "คณิตศาสตร์",
  science: "วิทยาศาสตร์", social: "สังคมศึกษา", art: "ศิลปะ", general: "ทั่วไป",
};

const EMOTION_EMOJI: Record<string, string> = {
  ดีใจ: "😊", เศร้า: "😢", โกรธ: "😠", เหนื่อย: "😴", กังวล: "😰",
};

const EMOTION_COLOR: Record<string, string> = {
  ดีใจ: "bg-yellow-100 text-yellow-700", เศร้า: "bg-blue-100 text-blue-700",
  โกรธ: "bg-red-100 text-red-700", เหนื่อย: "bg-gray-100 text-gray-600",
  กังวล: "bg-purple-100 text-purple-700",
};

const CATEGORY_COLOR: Record<string, string> = {
  physical: "bg-green-100 text-green-700", parent: "bg-pink-100 text-pink-700", reading: "bg-blue-100 text-blue-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDateRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function shortDay(dateStr: string): string {
  const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  return days[new Date(dateStr + "T12:00:00").getDay()];
}

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ParentReportPage() {
  const { childProfile, childAge, latestAssessment, assessmentHistory, isPremium, kidoSettings } = useProfile();
  const childName = childProfile?.name ?? "น้อง";

  const [tab, setTab]           = useState<"daily" | "weekly" | "monthly">("daily");
  const [daily, setDaily]       = useState<DailyData>({ date: "", screenMinutes: 0, physicalMinutes: 0, readingMinutes: 0, parentMinutes: 0, completedMissions: [] });
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [learning, setLearning] = useState<LearningLog[]>([]);
  const [lifeSkills, setLifeSkills] = useState<Record<string, string[]>>({});
  const [emotions, setEmotions] = useState<EmotionLog[]>([]);
  const [history, setHistory]   = useState<Record<string, DayHistory>>({});

  useEffect(() => {
    setDaily(loadDailyData());
    setSessions(loadLS<LocalSession[]>(SESSIONS_KEY, []));
    setLearning(loadLS<LearningLog[]>(LEARNING_KEY, []));
    setLifeSkills(loadLS<Record<string, string[]>>(LIFESKILLS_KEY, {}));
    setEmotions(loadLS<EmotionLog[]>(EMOTIONS_KEY, []));
    setHistory(loadDailyHistory());
  }, []);

  const today     = new Date().toISOString().slice(0, 10);
  const balance   = computeBalanceScore(daily);
  const limitMin  = kidoSettings?.dailyLimitMinutes ?? 60;
  const screenPct = Math.min(100, (daily.screenMinutes / limitMin) * 100);
  const scores    = latestAssessment?.scores as Record<string, number> | undefined;

  // ── Daily derived ─────────────────────────────────────────────────────────
  const todayLearning   = learning.filter((l) => l.date === today);
  const todayLifeSkills = lifeSkills[today] ?? [];
  const todayEmotions   = emotions.filter((e) => e.date === today);
  const todayGames      = sessions.filter((s) => s.date === today);
  const completedMissions = OFFLINE_MISSIONS.filter((m) => daily.completedMissions.includes(m.id));
  const avgAcc          = todayGames.length > 0
    ? Math.round(todayGames.reduce((s, g) => s + g.accuracy, 0) / todayGames.length) : 0;

  // ── Weekly derived ────────────────────────────────────────────────────────
  const weekDates = useMemo(() => getDateRange(7), []);

  const weekDayData = weekDates.map((date) => {
    const ls = (lifeSkills[date] ?? []).length;
    const lm = learning.filter((l) => l.date === date).reduce((s, l) => s + l.minutes, 0);
    const emo = emotions.filter((e) => e.date === date).slice(-1)[0]?.emotion ?? null;
    const games = sessions.filter((s) => s.date === date).length;
    const hist = history[date];
    return { date, ls, lm, emo, games, screen: hist?.screen ?? (date === today ? daily.screenMinutes : 0) };
  });

  const weekLearning = learning.filter((l) => weekDates.includes(l.date));
  const weekSubjects: Record<string, number> = {};
  weekLearning.forEach((l) => { weekSubjects[l.subject] = (weekSubjects[l.subject] ?? 0) + l.minutes; });
  const topSubjects = Object.entries(weekSubjects).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const weekEmotions: Record<string, number> = {};
  emotions.filter((e) => weekDates.includes(e.date)).forEach((e) => { weekEmotions[e.emotion] = (weekEmotions[e.emotion] ?? 0) + 1; });
  const topEmotions = Object.entries(weekEmotions).sort((a, b) => b[1] - a[1]);

  const weekLifeTotal = weekDates.reduce((s, d) => s + (lifeSkills[d] ?? []).length, 0);

  // streak: consecutive days with ≥4 life skills
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    if ((lifeSkills[k] ?? []).length >= 4) streak++;
    else break;
  }

  // ── Monthly derived ───────────────────────────────────────────────────────
  const monthDates = useMemo(() => getDateRange(30), []);
  const activeDays = monthDates.filter((d) => (lifeSkills[d] ?? []).length > 0 || learning.some((l) => l.date === d)).length;
  const monthLearningMin = learning.filter((l) => monthDates.includes(l.date)).reduce((s, l) => s + l.minutes, 0);
  const monthLifeTotal = monthDates.reduce((s, d) => s + (lifeSkills[d] ?? []).length, 0);
  const monthGames = sessions.filter((s) => monthDates.includes(s.date)).length;
  const monthSubjects: Record<string, number> = {};
  learning.filter((l) => monthDates.includes(l.date)).forEach((l) => { monthSubjects[l.subject] = (monthSubjects[l.subject] ?? 0) + l.minutes; });
  const topMonthSubjects = Object.entries(monthSubjects).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 pb-24">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 pt-3 pb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/dashboard">
              <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="font-black text-xl text-gray-900">👨‍👩‍👧 รายงานผู้ปกครอง</h1>
              <p className="text-xs text-gray-400">{childName} • {new Date().toLocaleDateString("th-TH", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {([["daily", "วันนี้"], ["weekly", "สัปดาห์นี้"], ["monthly", "เดือนนี้"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all ${
                  tab === key
                    ? "bg-white border border-b-white border-gray-100 text-indigo-600 -mb-px"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pt-5">

        {/* ══════════════════════════ DAILY TAB ══════════════════════════ */}
        {tab === "daily" && (
          <div className="space-y-4">

            {/* Summary banner */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain" />
                <p className="font-black text-base">สรุปวันนี้ของ{childName}</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "หน้าจอ",  value: `${daily.screenMinutes}`, unit: "นาที", icon: "📱" },
                  { label: "กิจกรรม", value: `${daily.physicalMinutes}`, unit: "นาที", icon: "🏃" },
                  { label: "เรียนรู้", value: `${daily.readingMinutes + todayLearning.reduce((s,l)=>s+l.minutes,0)}`, unit: "นาที", icon: "📚" },
                  { label: "ครอบครัว",value: `${daily.parentMinutes}`, unit: "นาที", icon: "👨‍👩‍👧" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/15 rounded-2xl p-2.5 text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-white font-black text-sm">{item.value}</div>
                    <div className="text-white/70 text-[9px]">{item.unit}</div>
                    <div className="text-white/60 text-[9px]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Score */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-purple-500" /> Daily Balance Score
                </h2>
                <div className="text-3xl font-black text-purple-600">{balance}<span className="text-base text-gray-400">/100</span></div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${balance}%`, background: balance >= 70 ? "#22c55e" : balance >= 40 ? "#f59e0b" : "#ef4444" }} />
              </div>
              <p className="text-xs text-gray-400 text-center">
                {balance >= 70 ? "🌟 วันนี้สมดุลดีมาก!" : balance >= 40 ? "😊 พอดี ลองเพิ่มกิจกรรมนะ" : "⚠️ ลดเวลาหน้าจอ เพิ่มกิจกรรม"}
              </p>
            </div>

            {/* Screen Time */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-indigo-500" /> เวลาหน้าจอวันนี้
                </h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${screenPct < 60 ? "bg-green-100 text-green-700" : screenPct < 90 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                  {daily.screenMinutes}/{limitMin} นาที
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${screenPct}%`, background: screenPct < 60 ? "#22c55e" : screenPct < 90 ? "#f59e0b" : "#ef4444" }} />
              </div>
              <p className="text-xs text-gray-400">ขีดจำกัด: {limitMin} นาที/วัน</p>
            </div>

            {/* EQ Emotions today */}
            {todayEmotions.length > 0 && (
              <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <Smile className="w-4 h-4 text-yellow-500" /> อารมณ์วันนี้
                </h2>
                <div className="flex flex-wrap gap-2">
                  {todayEmotions.map((e, i) => (
                    <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${EMOTION_COLOR[e.emotion] ?? "bg-gray-100 text-gray-600"}`}>
                      <span>{EMOTION_EMOJI[e.emotion] ?? "😊"}</span>
                      <span>{e.emotion}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">{childName}บอก Kido {todayEmotions.length} ครั้งวันนี้</p>
              </div>
            )}

            {/* Learning today */}
            {todayLearning.length > 0 && (
              <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-blue-500" /> เรียนกับ Kido วันนี้
                </h2>
                <div className="space-y-2">
                  {todayLearning.map((l, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="flex-1 text-sm font-semibold text-gray-700">{SUBJECT_LABEL[l.subject] ?? l.subject}</span>
                      <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">{l.minutes} นาที</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 mt-1">รวม {todayLearning.reduce((s, l) => s + l.minutes, 0)} นาที</p>
                </div>
              </div>
            )}

            {/* Life Skills today */}
            {todayLifeSkills.length > 0 && (
              <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-500" /> Life Skills วันนี้
                </h2>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl font-black text-green-500">{todayLifeSkills.length}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">ภารกิจสำเร็จ</p>
                    <p className="text-xs text-gray-400">เป็นนักสร้างนิสัยที่ดี!</p>
                  </div>
                  {streak >= 2 && (
                    <div className="ml-auto flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-black text-orange-600">{streak} วัน</span>
                    </div>
                  )}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full" style={{ width: `${Math.min(100, (todayLifeSkills.length / 10) * 100)}%` }} />
                </div>
              </div>
            )}

            {/* Missions completed */}
            {completedMissions.length > 0 && (
              <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> ภารกิจสำเร็จวันนี้
                </h2>
                <div className="space-y-2">
                  {completedMissions.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-lg">{m.emoji}</span>
                      <span className="flex-1 text-sm text-gray-700">{m.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[m.category]}`}>+{m.minutes} นาที</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent games */}
            {todayGames.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-amber-500" /> เกมที่เล่นวันนี้
                  </h2>
                  <span className="text-xs text-gray-400">ความแม่นยำเฉลี่ย <span className="font-bold text-purple-600">{avgAcc}%</span></span>
                </div>
                <div className="space-y-2">
                  {todayGames.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-purple-600">{s.accuracy}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.gameName}</p>
                        <p className="text-xs text-gray-400">{s.score}/{s.total} คะแนน</p>
                      </div>
                      <div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${s.accuracy}%`, background: s.accuracy >= 80 ? "#22c55e" : s.accuracy >= 50 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment */}
            {scores && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-rose-400" /> พัฒนาการล่าสุด
                  </h2>
                  <span className="text-xs text-gray-400">
                    {latestAssessment ? new Date(latestAssessment.date).toLocaleDateString("th-TH", { month: "short", day: "numeric" }) : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(scores).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-gray-600 shrink-0">{key}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${val}%`, background: val >= 75 ? "#22c55e" : val >= 50 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-8 text-right">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!latestAssessment && (
              <div className="bg-purple-50 border border-purple-200 rounded-3xl p-5 text-center">
                <p className="text-purple-700 font-semibold text-sm mb-3">ยังไม่ได้ทำแบบประเมินพัฒนาการ</p>
                <Link href="/dashboard/assessment">
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm px-6 py-3 rounded-2xl active:scale-95 transition-transform">
                    เริ่มประเมินตอนนี้ →
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ WEEKLY TAB ══════════════════════════ */}
        {tab === "weekly" && (
          <div className="space-y-4">

            {/* 7-day activity grid */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4 text-sm">📅 กิจกรรม 7 วันที่ผ่านมา</h2>
              <div className="flex gap-2">
                {weekDayData.map((day) => {
                  const isToday    = day.date === today;
                  const level      = day.ls >= 8 ? 4 : day.ls >= 5 ? 3 : day.ls >= 2 ? 2 : day.ls >= 1 ? 1 : 0;
                  const dotColors  = ["bg-gray-100", "bg-blue-200", "bg-yellow-300", "bg-green-400", "bg-emerald-500"];
                  return (
                    <div key={day.date} className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-2xl ${isToday ? "ring-2 ring-indigo-300 bg-indigo-50" : ""}`}>
                      <span className={`text-[9px] font-bold ${isToday ? "text-indigo-600" : "text-gray-400"}`}>{shortDay(day.date)}</span>
                      <div className={`w-9 h-9 rounded-full ${dotColors[level]} flex items-center justify-center`}>
                        {day.emo
                          ? <span className="text-lg">{EMOTION_EMOJI[day.emo] ?? "😊"}</span>
                          : <span className={`text-xs font-black ${level === 0 ? "text-gray-300" : "text-white"}`}>{day.ls}</span>}
                      </div>
                      {day.lm > 0 && <span className="text-[8px] text-blue-500 font-bold">{day.lm}m</span>}
                      {day.games > 0 && <span className="text-[8px] text-purple-400">🎮{day.games}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-4 justify-center">
                {[["bg-gray-100","ไม่มี"],["bg-blue-200","น้อย"],["bg-yellow-300","ปานกลาง"],["bg-emerald-500","ดีมาก"]].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                    <span className="text-[9px] text-gray-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary numbers */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-green-100 p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-green-500">{weekLifeTotal}</div>
                <div className="text-[10px] text-gray-500 mt-1">Life Skills</div>
                <div className="text-[9px] text-gray-400">ภารกิจรวม 7 วัน</div>
              </div>
              <div className="bg-white rounded-2xl border border-blue-100 p-4 text-center shadow-sm">
                <div className="text-3xl font-black text-blue-500">{Math.round(weekDayData.reduce((s,d)=>s+d.lm,0)/60*10)/10}h</div>
                <div className="text-[10px] text-gray-500 mt-1">เรียนรู้</div>
                <div className="text-[9px] text-gray-400">รวมสัปดาห์นี้</div>
              </div>
              <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-3xl font-black text-orange-500">{streak}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Streak</div>
                <div className="text-[9px] text-gray-400">วันต่อเนื่อง</div>
              </div>
            </div>

            {/* Subjects this week */}
            {topSubjects.length > 0 && (
              <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-4 text-sm">📚 วิชาที่เรียนสัปดาห์นี้</h2>
                <div className="space-y-3">
                  {topSubjects.map(([subj, mins]) => {
                    const maxMins = topSubjects[0]?.[1] ?? 1;
                    return (
                      <div key={subj}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{SUBJECT_LABEL[subj] ?? subj}</span>
                          <span className="text-xs text-blue-600 font-bold">{mins} นาที</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" style={{ width: `${(mins / maxMins) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Emotions this week */}
            {topEmotions.length > 0 && (
              <div className="bg-white rounded-3xl border border-yellow-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-4 text-sm">💛 อารมณ์สัปดาห์นี้</h2>
                <div className="flex flex-wrap gap-3">
                  {topEmotions.map(([emo, count]) => (
                    <div key={emo} className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${EMOTION_COLOR[emo] ?? "bg-gray-100 text-gray-600"}`}>
                      <span className="text-2xl">{EMOTION_EMOJI[emo] ?? "😊"}</span>
                      <div>
                        <p className="text-xs font-black">{emo}</p>
                        <p className="text-[9px] opacity-70">{count} ครั้ง</p>
                      </div>
                    </div>
                  ))}
                </div>
                {topEmotions[0] && (
                  <p className="text-xs text-gray-400 mt-3">
                    อารมณ์ที่พบบ่อยที่สุด: <span className="font-bold text-gray-600">{topEmotions[0][0]}</span> {topEmotions[0][1]} ครั้ง
                  </p>
                )}
              </div>
            )}

            {/* Screen time week */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4 text-sm">📱 เวลาหน้าจอ 7 วัน</h2>
              <div className="flex items-end gap-2 h-20">
                {weekDayData.map((day) => {
                  const maxScreen = Math.max(...weekDayData.map(d => d.screen), 1);
                  const h = Math.round((day.screen / maxScreen) * 100);
                  const over = day.screen > limitMin;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                        <div
                          className={`w-full rounded-t-lg transition-all ${over ? "bg-red-400" : "bg-indigo-300"}`}
                          style={{ height: `${Math.max(4, h * 0.6)}px` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-400">{shortDay(day.date)}</span>
                      <span className={`text-[8px] font-bold ${over ? "text-red-500" : "text-gray-500"}`}>{day.screen}m</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">เส้นสีแดง = เกินขีดจำกัด {limitMin} นาที</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════ MONTHLY TAB ══════════════════════════ */}
        {tab === "monthly" && (
          <div className="space-y-4">

            {/* Big stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "วันที่มีกิจกรรม",   value: activeDays,                icon: "📅", color: "text-indigo-600", border: "border-indigo-100" },
                { label: "ชั่วโมงเรียนรู้",   value: `${Math.round(monthLearningMin/60*10)/10}h`, icon: "📚", color: "text-blue-600",   border: "border-blue-100" },
                { label: "Life Skills รวม",   value: monthLifeTotal,             icon: "🌟", color: "text-green-600",  border: "border-green-100" },
                { label: "เกมที่เล่น",         value: `${monthGames} ครั้ง`,      icon: "🎮", color: "text-purple-600", border: "border-purple-100" },
              ].map((s) => (
                <div key={s.label} className={`bg-white rounded-3xl border ${s.border} p-5 shadow-sm`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-[11px] text-gray-500">{s.label}</div>
                  <div className="text-[9px] text-gray-400">30 วันที่ผ่านมา</div>
                </div>
              ))}
            </div>

            {/* Top subjects monthly */}
            {topMonthSubjects.length > 0 && (
              <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-4 text-sm">📖 วิชาที่เรียนเดือนนี้</h2>
                <div className="space-y-3">
                  {topMonthSubjects.map(([subj, mins], i) => (
                    <div key={subj} className="flex items-center gap-3">
                      <span className="text-base">{["🥇","🥈","🥉"][i] ?? "📚"}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700">{SUBJECT_LABEL[subj] ?? subj}</span>
                          <span className="text-xs text-blue-600 font-bold">{Math.round(mins/60*10)/10}h</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" style={{ width: `${(mins / (topMonthSubjects[0]?.[1] ?? 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Life Skills trend */}
            <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-4 text-sm">🌟 Life Skills เดือนนี้</h2>
              <div className="flex items-end gap-1 h-20">
                {Array.from({ length: 30 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (29 - i));
                  const k = d.toISOString().slice(0, 10);
                  const count = (lifeSkills[k] ?? []).length;
                  return { k, count };
                }).map(({ k, count }) => {
                  const h = Math.max(2, Math.round((count / 10) * 60));
                  return (
                    <div key={k} className="flex-1 flex items-end">
                      <div
                        className={`w-full rounded-sm transition-all ${count >= 8 ? "bg-green-500" : count >= 4 ? "bg-green-300" : count > 0 ? "bg-green-100" : "bg-gray-100"}`}
                        style={{ height: `${h}px` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">กราฟ Life Skills 30 วันที่ผ่านมา</p>
              <div className="flex items-center gap-4 justify-center mt-2">
                {[["bg-green-100","1-3"],["bg-green-300","4-7"],["bg-green-500","8+"]].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-sm ${c}`} /><span className="text-[9px] text-gray-400">{l} ภารกิจ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment */}
            {scores && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-rose-400" /> พัฒนาการ
                  </h2>
                  <span className="text-xs text-gray-400">ประเมินครั้งที่ {assessmentHistory.length}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(scores).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-gray-600 shrink-0">{key}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${val}%`, background: val >= 75 ? "#22c55e" : val >= 50 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-8 text-right">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights - Premium teaser */}
            <div className={`rounded-3xl border p-5 ${isPremium ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200" : "bg-gray-50 border-gray-200"}`}>
              <h2 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
                <span>🤖</span> AI วิเคราะห์นิสัยเด็ก
                {!isPremium && <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full">PREMIUM</span>}
              </h2>
              {isPremium ? (
                <div className="space-y-2">
                  <div className="bg-white rounded-2xl p-3 border border-purple-100">
                    <p className="text-xs font-bold text-green-600 mb-1">✅ จุดแข็ง</p>
                    <p className="text-xs text-gray-600">
                      {monthLifeTotal > 50 ? "มีวินัยและความสม่ำเสมอดีมาก" : monthLifeTotal > 20 ? "เริ่มสร้างนิสัยดีได้แล้ว" : "กำลังเริ่มต้นสร้างนิสัย"}
                      {topMonthSubjects[0] && ` • ชอบเรียน${SUBJECT_LABEL[topMonthSubjects[0][0]] ?? topMonthSubjects[0][0]}`}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-purple-100">
                    <p className="text-xs font-bold text-amber-600 mb-1">🎯 ควรพัฒนา</p>
                    <p className="text-xs text-gray-600">
                      {activeDays < 15 ? "เพิ่มความสม่ำเสมอของกิจกรรมรายวัน" : "คงความสม่ำเสมอที่ดีนี้ไว้"}
                      {daily.screenMinutes > limitMin ? " • ลดเวลาหน้าจอให้อยู่ในขีดจำกัด" : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">อัพเกรดเป็น Premium เพื่อดูการวิเคราะห์จุดแข็ง จุดที่ควรพัฒนา และแผนฝึกเฉพาะบุคคล</p>
                  <Link href="/dashboard/upgrade">
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-transform">
                      ดูแผน Premium →
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
