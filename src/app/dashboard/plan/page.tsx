"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sun, Cloud, Moon, Play, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

const weekDays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const today = new Date().getDay();
const adjustedToday = today === 0 ? 6 : today - 1;

const weekPlan = [
  {
    day: "จันทร์",
    sessions: [
      { time: "เช้า", activity: "ฝึกคำศัพท์จากภาพ", duration: "10 นาที", category: "ภาษา", done: true, icon: Sun, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
      { time: "บ่าย", activity: "เกมจับคู่ภาพเหมือน", duration: "10 นาที", category: "การเรียนรู้", done: true, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
      { time: "เย็น", activity: "เล่านิทานก่อนนอน", duration: "10 นาที", category: "ภาษา", done: true, icon: Moon, color: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-500" },
    ],
  },
  {
    day: "อังคาร",
    sessions: [
      { time: "เช้า", activity: "บัตรคำศัพท์สัตว์", duration: "10 นาที", category: "ภาษา", done: true, icon: Sun, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
      { time: "บ่าย", activity: "เกมจับคู่รูปทรง", duration: "10 นาที", category: "การเรียนรู้", done: false, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
      { time: "เย็น", activity: "ร้องเพลงเด็ก", duration: "5 นาที", category: "ภาษา", done: false, icon: Moon, color: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-500" },
    ],
  },
  {
    day: "พุธ",
    sessions: [
      { time: "เช้า", activity: "ฝึกออกเสียงสระ", duration: "10 นาที", category: "ภาษา", done: false, icon: Sun, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
      { time: "บ่าย", activity: "เกมปริศนาภาพ", duration: "10 นาที", category: "สมาธิ", done: false, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
      { time: "เย็น", activity: "เล่านิทานสั้น", duration: "10 นาที", category: "ภาษา", done: false, icon: Moon, color: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-500" },
    ],
  },
  {
    day: "พฤหัส",
    sessions: [
      { time: "เช้า", activity: "บัตรคำผลไม้", duration: "10 นาที", category: "ภาษา", done: false, icon: Sun, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
      { time: "บ่าย", activity: "เกมชี้อวัยวะ", duration: "10 นาที", category: "การสื่อสาร", done: false, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
      { time: "เย็น", activity: "กิจกรรมวาดภาพ", duration: "15 นาที", category: "กล้ามเนื้อ", done: false, icon: Moon, color: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-500" },
    ],
  },
  {
    day: "ศุกร์",
    sessions: [
      { time: "เช้า", activity: "เกมตามคำสั่ง", duration: "10 นาที", category: "สมาธิ", done: false, icon: Sun, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
      { time: "บ่าย", activity: "ร้องเพลงพร้อมท่าทาง", duration: "10 นาที", category: "กล้ามเนื้อ", done: false, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
      { time: "เย็น", activity: "เล่านิทาน + ทบทวนคำศัพท์", duration: "15 นาที", category: "ภาษา", done: false, icon: Moon, color: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-500" },
    ],
  },
  {
    day: "เสาร์",
    sessions: [
      { time: "เช้า", activity: "เกมระบายสี", duration: "15 นาที", category: "กล้ามเนื้อ", done: false, icon: Sun, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
      { time: "บ่าย", activity: "เล่นบทบาทสมมติ", duration: "15 นาที", category: "การสื่อสาร", done: false, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
    ],
  },
  {
    day: "อาทิตย์",
    sessions: [
      { time: "บ่าย", activity: "อ่านหนังสือนิทาน", duration: "15 นาที", category: "ภาษา", done: false, icon: Cloud, color: "bg-blue-50 border-blue-200", iconColor: "text-blue-400" },
      { time: "เย็น", activity: "ทบทวนสัปดาห์", duration: "10 นาที", category: "การเรียนรู้", done: false, icon: Moon, color: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-500" },
    ],
  },
];

const categoryColors: Record<string, string> = {
  ภาษา: "bg-emerald-100 text-emerald-700",
  การสื่อสาร: "bg-blue-100 text-blue-700",
  การเรียนรู้: "bg-purple-100 text-purple-700",
  สมาธิ: "bg-red-100 text-red-600",
  กล้ามเนื้อ: "bg-amber-100 text-amber-700",
};

export default function TrainingPlanPage() {
  const [selectedDay, setSelectedDay] = useState(adjustedToday);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const dayData = weekPlan[selectedDay];
  const toggleDone = (key: string) => setDone((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalSessions = dayData.sessions.length;
  const completedSessions = dayData.sessions.filter(
    (s, i) => s.done || done[`${selectedDay}-${i}`]
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แผนการฝึก</h1>
          <p className="text-gray-500 text-sm mt-0.5">กิจกรรมที่ AI สร้างเฉพาะสำหรับน้องนุ่น</p>
        </div>
        <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 gap-2">
          <RefreshCw className="w-4 h-4" />
          สร้างแผนใหม่
        </Button>
      </div>

      {/* Week Selector */}
      <Card className="p-4 mb-5 border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            สัปดาห์นี้
          </span>
          <button className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day, i) => (
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
                {i + 1}
              </span>
              {weekPlan[i].sessions.some((s) => s.done) && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${i === selectedDay ? "bg-white" : "bg-green-500"}`} />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Progress for Day */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${totalSessions ? (completedSessions / totalSessions) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600">
          {completedSessions}/{totalSessions} กิจกรรม
        </span>
      </div>

      {/* Sessions */}
      <div className="space-y-4 mb-6">
        <h2 className="font-bold text-gray-900">
          {dayData.day} — กิจกรรมประจำวัน
        </h2>
        {dayData.sessions.map((session, i) => {
          const key = `${selectedDay}-${i}`;
          const isDone = session.done || done[key];
          return (
            <Card
              key={i}
              className={`p-4 border shadow-sm transition-all ${session.color} ${isDone ? "opacity-75" : ""}`}
            >
              <div className="flex items-start gap-4">
                <session.icon className={`w-6 h-6 ${session.iconColor} shrink-0 mt-0.5`} />
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDone(key)}
                    className="shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-purple-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
              {!isDone && (
                <div className="mt-3 ml-10">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl h-8 text-xs gap-1.5">
                    <Play className="w-3 h-3" />
                    เริ่มกิจกรรม
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* AI Note */}
      <Card className="p-5 border-purple-100 bg-purple-50 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          🤖 หมายเหตุจาก AI Coach
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          แผนฝึกสัปดาห์นี้เน้นพัฒนาด้าน<strong>ภาษา</strong>และ<strong>การสื่อสาร</strong>
          เป็นหลัก เพราะน้องนุ่นมีคะแนนด้านนี้ที่ควรพัฒนาเพิ่ม
          ฝึกให้สม่ำเสมอทุกวัน แม้แค่ 10-15 นาที ก็เห็นผลได้ดีค่ะ 💜
        </p>
      </Card>
    </div>
  );
}
