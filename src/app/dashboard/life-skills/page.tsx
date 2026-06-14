"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import {
  loadDailyData, completeMission, OFFLINE_MISSIONS, type DailyData,
} from "@/lib/daily-data";
import { ChevronLeft, CheckCircle2, Circle, Star, Trophy } from "lucide-react";
import toast from "react-hot-toast";

const BADGES = [
  { id: "starter",   emoji: "🌱", title: "เริ่มต้น",          desc: "ทำภารกิจ 1 อย่าง",         min: 1 },
  { id: "active",    emoji: "🌿", title: "นักฝึกหัด",         desc: "ทำภารกิจ 3 อย่าง",         min: 3 },
  { id: "champion",  emoji: "🌳", title: "นักพัฒนาตัวน้อย",  desc: "ทำภารกิจ 5 อย่าง",         min: 5 },
  { id: "master",    emoji: "🏆", title: "แชมป์วันนี้",       desc: "ทำภารกิจครบทุกอย่าง",     min: OFFLINE_MISSIONS.length },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  physical: { label: "กิจกรรม",   color: "text-green-600",  bg: "bg-green-50 border-green-100"  },
  parent:   { label: "ครอบครัว", color: "text-pink-600",   bg: "bg-pink-50 border-pink-100"    },
  reading:  { label: "เรียนรู้",  color: "text-blue-600",   bg: "bg-blue-50 border-blue-100"    },
};

export default function LifeSkillsPage() {
  const { childProfile } = useProfile();
  const childName = childProfile?.name ?? "น้อง";

  const [dailyData, setDailyData] = useState<DailyData>({
    date: "", screenMinutes: 0, physicalMinutes: 0, readingMinutes: 0, parentMinutes: 0, completedMissions: [],
  });

  useEffect(() => {
    setDailyData(loadDailyData());
  }, []);

  function handleComplete(mission: (typeof OFFLINE_MISSIONS)[0]) {
    if (dailyData.completedMissions.includes(mission.id)) return;
    const updated = completeMission(mission);
    setDailyData(updated);
    toast.success(`${mission.emoji} สำเร็จ! ได้รับ ${mission.minutes} นาที`, { icon: "⭐" });
  }

  const completedCount = dailyData.completedMissions.length;
  const earnedBadge = [...BADGES].reverse().find((b) => completedCount >= b.min);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🌟 Kido Life Skills</h1>
            <p className="text-sm text-gray-500">ภารกิจประจำวันของ{childName}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-amber-100 p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-2xl font-black text-amber-500">{completedCount}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">ดาวได้รับ</div>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-3 text-center shadow-sm">
            <div className="text-2xl font-black text-green-500 mb-1">{completedCount}/{OFFLINE_MISSIONS.length}</div>
            <div className="text-[10px] text-gray-500 font-medium">ภารกิจสำเร็จ</div>
          </div>
          <div className="bg-white rounded-2xl border border-purple-100 p-3 text-center shadow-sm">
            <div className="text-lg font-black text-purple-500 mb-1">{earnedBadge?.emoji ?? "🌱"}</div>
            <div className="text-[10px] text-gray-500 font-medium">{earnedBadge?.title ?? "เริ่มต้น"}</div>
          </div>
        </div>

        {/* Badge progress */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-5">
          <h2 className="font-bold text-gray-800 mb-3 text-sm">🏅 ป้ายรางวัลวันนี้</h2>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map((badge) => {
              const earned = completedCount >= badge.min;
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                    earned ? "border-amber-300 bg-amber-50 shadow-sm" : "border-gray-100 bg-gray-50 opacity-40"
                  }`}
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-[9px] font-bold text-gray-700 text-center leading-tight">{badge.title}</span>
                  <span className="text-[8px] text-gray-400 text-center leading-tight">{badge.desc}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-green-400 rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / OFFLINE_MISSIONS.length) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">{completedCount}/{OFFLINE_MISSIONS.length} ภารกิจ</p>
        </div>

        {/* Mission list */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800 text-sm">📋 ภารกิจวันนี้</h2>
          {OFFLINE_MISSIONS.map((mission) => {
            const done = dailyData.completedMissions.includes(mission.id);
            const cat = CATEGORY_LABELS[mission.category];
            return (
              <button
                key={mission.id}
                onClick={() => handleComplete(mission)}
                disabled={done}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${
                  done
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 active:scale-[0.98]"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">{mission.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${done ? "text-green-700 line-through" : "text-gray-900"}`}>
                    {mission.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-gray-400">+{mission.minutes} นาที</span>
                    {done && <span className="text-[10px] text-green-600 font-bold">✓ ทำแล้ว</span>}
                  </div>
                </div>
                {done ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                ) : (
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <Circle className="w-6 h-6 text-gray-300" />
                    <span className="text-[8px] text-gray-300">แตะ</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* All done celebration */}
        {completedCount >= OFFLINE_MISSIONS.length && (
          <div className="mt-6 bg-gradient-to-r from-amber-400 to-green-500 rounded-3xl p-5 text-center shadow-lg">
            <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
            <p className="text-white font-black text-lg">เก่งมาก{childName}!</p>
            <p className="text-white/80 text-sm mt-1">ทำภารกิจครบทุกอย่างวันนี้แล้ว 🏆</p>
          </div>
        )}
      </div>
    </div>
  );
}
