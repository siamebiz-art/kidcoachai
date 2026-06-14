"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { loadDailyData, computeBalanceScore, OFFLINE_MISSIONS, type DailyData } from "@/lib/daily-data";
import { ChevronLeft, Clock, Star, Trophy, BarChart3, Heart } from "lucide-react";

const SESSIONS_KEY   = "kidocoachai-sessions";
const LEARNING_KEY   = "kidocoachai-learning";

const SUBJECT_LABEL: Record<string, string> = {
  thai: "ภาษาไทย", english: "ภาษาอังกฤษ", math: "คณิตศาสตร์",
  science: "วิทยาศาสตร์", social: "สังคมศึกษา", art: "ศิลปะ", general: "ทั่วไป",
};

interface LocalSession {
  gameName: string;
  score: number;
  total: number;
  accuracy: number;
  date: string;
}

interface LearningLog { date: string; subject: string; minutes: number }

function loadLocalSessions(): LocalSession[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]").slice(0, 20); }
  catch { return []; }
}

const CATEGORY_COLOR: Record<string, string> = {
  physical: "bg-green-100 text-green-700",
  parent:   "bg-pink-100 text-pink-700",
  reading:  "bg-blue-100 text-blue-700",
};

export default function ParentReportPage() {
  const {
    childProfile, childAge, latestAssessment, assessmentHistory,
    gameSessions, isPremium, kidoSettings,
  } = useProfile();

  const childName = childProfile?.name ?? "น้อง";
  const [daily, setDaily] = useState<DailyData>({
    date: "", screenMinutes: 0, physicalMinutes: 0, readingMinutes: 0, parentMinutes: 0, completedMissions: [],
  });
  const [localSessions,  setLocalSessions]  = useState<LocalSession[]>([]);
  const [learningToday,  setLearningToday]  = useState<LearningLog[]>([]);

  useEffect(() => {
    setDaily(loadDailyData());
    setLocalSessions(loadLocalSessions());
    const today = new Date().toISOString().slice(0, 10);
    try {
      const all: LearningLog[] = JSON.parse(localStorage.getItem(LEARNING_KEY) ?? "[]");
      setLearningToday(all.filter((l) => l.date === today));
    } catch { /* ignore */ }
  }, []);

  const balance       = computeBalanceScore(daily);
  const limitMinutes  = kidoSettings.dailyLimitMinutes || 60;
  const screenPct     = Math.min(100, (daily.screenMinutes / limitMinutes) * 100);
  const completedMissions = OFFLINE_MISSIONS.filter((m) => daily.completedMissions.includes(m.id));
  const scores        = latestAssessment?.scores as Record<string, number> | undefined;
  const recentGames   = localSessions.slice(0, 5);
  const avgAccuracy   = recentGames.length > 0
    ? Math.round(recentGames.reduce((s, g) => s + g.accuracy, 0) / recentGames.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">👨‍👩‍👧 รายงานผู้ปกครอง</h1>
            <p className="text-sm text-gray-500">สรุปพัฒนาการของ{childName} วันนี้</p>
          </div>
        </div>

        {/* Daily Summary Banner */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-5 mb-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-black text-base">สรุปวันนี้ของ{childName}</p>
              <p className="text-white/60 text-xs">{new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "หน้าจอ", value: `${daily.screenMinutes} นาที`, icon: "📱" },
              { label: "กิจกรรม", value: `${daily.physicalMinutes} นาที`, icon: "🏃" },
              { label: "เรียนรู้", value: `${daily.readingMinutes} นาที`, icon: "📚" },
              { label: "ครอบครัว", value: `${daily.parentMinutes} นาที`, icon: "👨‍👩‍👧" },
            ].map((item) => (
              <div key={item.label} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-white font-black text-xs leading-tight">{item.value}</div>
                <div className="text-white/60 text-[9px]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Score */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" /> Daily Balance Score
            </h2>
            <div className="text-3xl font-black text-purple-600">{balance}<span className="text-base text-gray-400">/100</span></div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${balance}%`,
                background: balance >= 70 ? "#22c55e" : balance >= 40 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            {balance >= 70 ? "🌟 วันนี้ยอดเยี่ยมมาก! สมดุลดีมาก"
              : balance >= 40 ? "😊 พอดี แต่ลองเพิ่มกิจกรรมเพิ่มนะ"
              : "⚠️ ลองลดเวลาหน้าจอ เพิ่มกิจกรรมกลางแจ้ง"}
          </p>
        </div>

        {/* Screen Time */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> เวลาหน้าจอวันนี้
            </h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              screenPct < 60 ? "bg-green-100 text-green-700" : screenPct < 90 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
            }`}>
              {daily.screenMinutes}/{limitMinutes} นาที
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${screenPct}%`,
                background: screenPct < 60 ? "#22c55e" : screenPct < 90 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <p className="text-xs text-gray-400">ขีดจำกัดที่ตั้งไว้: {limitMinutes} นาที/วัน</p>
        </div>

        {/* Learning today */}
        {learningToday.length > 0 && (
          <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 mb-4">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>🎓</span> เรียนกับ Kido วันนี้
            </h2>
            <div className="space-y-2">
              {learningToday.map((l, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-semibold text-gray-700 flex-1">{SUBJECT_LABEL[l.subject] ?? l.subject}</span>
                  <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">{l.minutes} นาที</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-1">
                รวม {learningToday.reduce((s, l) => s + l.minutes, 0)} นาที
              </p>
            </div>
          </div>
        )}

        {/* Missions completed */}
        {completedMissions.length > 0 && (
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-5 mb-4">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> ภารกิจที่ทำสำเร็จวันนี้
            </h2>
            <div className="space-y-2">
              {completedMissions.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xl">{m.emoji}</span>
                  <span className="flex-1 text-sm text-gray-700">{m.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[m.category]}`}>
                    +{m.minutes} นาที
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Games */}
        {recentGames.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> เกมที่เล่นล่าสุด
              </h2>
              <span className="text-xs text-gray-400">ความแม่นยำเฉลี่ย <span className="font-bold text-purple-600">{avgAccuracy}%</span></span>
            </div>
            <div className="space-y-2">
              {recentGames.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-purple-600">{s.accuracy}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.gameName}</p>
                    <p className="text-xs text-gray-400">{s.score}/{s.total} คะแนน</p>
                  </div>
                  <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.accuracy}%`,
                        background: s.accuracy >= 80 ? "#22c55e" : s.accuracy >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment overview */}
        {scores && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
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
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val}%`,
                        background: val >= 75 ? "#22c55e" : val >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-10 text-right">{val}%</span>
                </div>
              ))}
            </div>
            {assessmentHistory.length >= 2 && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                ประเมินครั้งที่ {assessmentHistory.length} • ดูกราฟพัฒนาการที่
                <Link href="/dashboard/progress" className="text-purple-500 font-bold ml-1">Progress →</Link>
              </p>
            )}
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
    </div>
  );
}
