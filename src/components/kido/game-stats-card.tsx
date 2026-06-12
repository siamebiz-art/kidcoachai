"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronRight, Gamepad2, TrendingUp, Trophy } from "lucide-react";
import type { GameSession } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

const GAME_EMOJI: Record<string, string> = {
  "flashcard":    "🃏", "picture-quiz": "👆", "memory":        "🧩",
  "counting":     "🔢", "sorting":      "🗂️", "emotion":       "🫀",
  "shapes":       "🔴", "sequence":     "📋", "bubble-pop":    "🫧",
  "opposite":     "🔄", "dialogue":     "💬", "needs":         "🙋",
  "odd-one-out":  "🔍", "rhythm":       "🥁", "word-category": "🏷️",
  "color":        "🎨",
};

function accuracyColor(acc: number) {
  if (acc >= 80) return "#10B981";
  if (acc >= 60) return "#F59E0B";
  return "#EF4444";
}

function accuracyLabel(acc: number) {
  if (acc >= 80) return { text: "เก่งมาก!", color: "text-green-600" };
  if (acc >= 60) return { text: "ดีมาก",   color: "text-amber-600" };
  return              { text: "ฝึกต่อไป",  color: "text-red-500"   };
}

interface Props {
  gameSessions: GameSession[];
  compact?: boolean;
}

export function GameStatsCard({ gameSessions, compact = false }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const todaySessions = useMemo(
    () => gameSessions.filter((s) => s.date === today).slice(-8),
    [gameSessions, today]
  );

  const avgAccuracy = todaySessions.length > 0
    ? Math.round(todaySessions.reduce((sum, s) => sum + s.accuracy, 0) / todaySessions.length)
    : 0;

  const totalScore = todaySessions.reduce((sum, s) => sum + s.score, 0);
  const totalItems = todaySessions.reduce((sum, s) => sum + s.total, 0);

  const sevenDaysData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const sessions = gameSessions.filter((s) => s.date === dateStr);
      const avg = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)
        : 0;
      const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
      result.push({
        day: i === 0 ? "วันนี้" : dayNames[d.getDay()],
        count: sessions.length,
        accuracy: avg,
        isToday: i === 0,
      });
    }
    return result;
  }, [gameSessions]);

  // Empty state
  if (gameSessions.length === 0) {
    return (
      <Card className="p-5 border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-gray-900 text-sm">สถิติการเล่นเกม</h3>
          </div>
          <Link href="/dashboard/activities" className="text-xs text-purple-600 flex items-center gap-0.5 hover:underline">
            ไปเล่นเลย <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎮</div>
          <p className="text-sm text-gray-400">ยังไม่ได้เล่นเกมเลย<br/>ลองไปเล่นกับ Kido กันนะ!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-100 shadow-sm">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-white/80" />
          <span className="text-white font-bold text-sm">สถิติการเล่นเกม</span>
        </div>
        <Link href="/dashboard/progress" className="text-white/80 text-xs flex items-center gap-0.5 hover:text-white">
          ดูทั้งหมด <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-5">
        {/* Today summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-purple-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-purple-700">{todaySessions.length}</div>
            <div className="text-[10px] text-purple-500 font-medium">เกมวันนี้</div>
          </div>
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-green-700">{avgAccuracy}%</div>
            <div className="text-[10px] text-green-500 font-medium">คะแนนเฉลี่ย</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-amber-700">{totalItems > 0 ? totalScore : "—"}</div>
            <div className="text-[10px] text-amber-500 font-medium">ข้อถูกวันนี้</div>
          </div>
        </div>

        {/* Today's sessions */}
        {todaySessions.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 mb-2.5">🎯 เล่นวันนี้</p>
            <div className="space-y-2.5">
              {todaySessions.map((s, i) => {
                const label = accuracyLabel(s.accuracy);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl shrink-0 w-7 text-center">{GAME_EMOJI[s.gameId] ?? "🎮"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-700 truncate mr-2">{s.gameName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-bold text-gray-600">{s.score}/{s.total}</span>
                          <span className={`text-[10px] font-bold ${label.color}`}>{label.text}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${s.accuracy}%`, backgroundColor: accuracyColor(s.accuracy) }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7-day chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-[11px] font-bold text-gray-400">จำนวนเกมใน 7 วันที่ผ่านมา</p>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={sevenDaysData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", padding: "4px 8px" }}
                formatter={(v: number | string | undefined) => [`${v ?? 0} เกม`, ""]}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={32}>
                {sevenDaysData.map((entry, i) => (
                  <Cell key={i} fill={entry.isToday ? "#7C3AED" : entry.count > 0 ? "#C4B5FD" : "#F3F4F6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best game today */}
        {todaySessions.length > 0 && (() => {
          const best = todaySessions.reduce((a, b) => a.accuracy > b.accuracy ? a : b);
          return (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-2xl px-3 py-2.5">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-bold">เก่งที่สุดวันนี้:</span> {GAME_EMOJI[best.gameId] ?? "🎮"} {best.gameName} — {best.accuracy}%
              </p>
            </div>
          );
        })()}
      </div>
    </Card>
  );
}
