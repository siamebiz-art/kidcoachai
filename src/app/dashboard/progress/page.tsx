"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Download, Calendar } from "lucide-react";

const monthlyData = [
  { month: "ม.ค.", ภาษา: 55, การสื่อสาร: 50, การเรียนรู้: 65, สมาธิ: 40, กล้ามเนื้อ: 60 },
  { month: "ก.พ.", ภาษา: 58, การสื่อสาร: 53, การเรียนรู้: 68, สมาธิ: 43, กล้ามเนื้อ: 63 },
  { month: "มี.ค.", ภาษา: 62, การสื่อสาร: 57, การเรียนรู้: 72, สมาธิ: 47, กล้ามเนื้อ: 66 },
  { month: "เม.ย.", ภาษา: 66, การสื่อสาร: 62, การเรียนรู้: 75, สมาธิ: 52, กล้ามเนื้อ: 69 },
  { month: "พ.ค.", ภาษา: 72, การสื่อสาร: 68, การเรียนรู้: 80, สมาธิ: 60, กล้ามเนื้อ: 75 },
];

const weeklyActivity = [
  { week: "สัปดาห์ 1", กิจกรรม: 12 },
  { week: "สัปดาห์ 2", กิจกรรม: 15 },
  { week: "สัปดาห์ 3", กิจกรรม: 10 },
  { week: "สัปดาห์ 4", กิจกรรม: 18 },
];

const radarData = [
  { subject: "ภาษา", score: 72, fullMark: 100 },
  { subject: "สื่อสาร", score: 68, fullMark: 100 },
  { subject: "เรียนรู้", score: 80, fullMark: 100 },
  { subject: "สมาธิ", score: 60, fullMark: 100 },
  { subject: "กล้ามเนื้อ", score: 75, fullMark: 100 },
];

const milestones = [
  { date: "5 พ.ค.", event: "พูดประโยค 2 คำได้เป็นครั้งแรก", category: "ภาษา", color: "bg-emerald-500" },
  { date: "20 เม.ย.", event: "นั่งทำกิจกรรมได้นาน 5 นาที", category: "สมาธิ", color: "bg-red-500" },
  { date: "10 เม.ย.", event: "จำชื่อสัตว์ได้ 10 ชนิด", category: "ภาษา", color: "bg-emerald-500" },
  { date: "1 มี.ค.", event: "เริ่มสบตาเวลาพูดด้วยบ้าง", category: "สื่อสาร", color: "bg-blue-500" },
];

const periods = ["รายสัปดาห์", "รายเดือน", "ไตรมาส"];

export default function ProgressPage() {
  const [period, setPeriod] = useState("รายเดือน");

  const improvements = [
    { label: "ภาษา", from: 55, to: 72, color: "text-emerald-600" },
    { label: "การสื่อสาร", from: 50, to: 68, color: "text-blue-600" },
    { label: "การเรียนรู้", from: 65, to: 80, color: "text-purple-600" },
    { label: "สมาธิ", from: 40, to: 60, color: "text-red-500" },
    { label: "กล้ามเนื้อ", from: 60, to: 75, color: "text-amber-600" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ติดตามผลพัฒนาการ</h1>
          <p className="text-gray-500 text-sm mt-0.5">น้องนุ่น • อายุ 4 ปี 2 เดือน</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-gray-200 gap-2">
            <Download className="w-4 h-4" />
            ส่งออก PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "คะแนนรวม", value: "71%", change: "+12%", icon: "📊" },
          { label: "วันที่ฝึก", value: "47 วัน", change: "+7 วันนี้", icon: "📅" },
          { label: "กิจกรรมสำเร็จ", value: "55 ครั้ง", change: "+18 สัปดาห์นี้", icon: "✅" },
          { label: "สายต่อเนื่อง", value: "7 วัน", change: "สูงสุด!", icon: "🔥" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 border-gray-100 shadow-sm">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stat.change}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Line Chart */}
        <Card className="p-5 border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">กราฟพัฒนาการ 5 เดือน</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ภาษา" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="การสื่อสาร" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="การเรียนรู้" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="สมาธิ" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="กล้ามเนื้อ" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar Chart */}
        <Card className="p-5 border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">ภาพรวมพัฒนาการ</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <Radar
                name="คะแนน"
                dataKey="score"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Activity Bar Chart */}
        <Card className="p-5 border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">กิจกรรมรายสัปดาห์</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="กิจกรรม" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Improvements */}
        <Card className="p-5 border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">ความก้าวหน้า 5 เดือน</h2>
          <div className="space-y-4">
            {improvements.map((imp) => (
              <div key={imp.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{imp.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{imp.from}%</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className={`text-sm font-bold ${imp.color}`}>{imp.to}%</span>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs py-0">
                      +{imp.to - imp.from}%
                    </Badge>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
                    style={{ width: `${imp.to}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Milestones */}
      <Card className="p-5 border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          ไทม์ไลน์ความสำเร็จ
        </h2>
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${m.color} shrink-0 mt-1`} />
                {i < milestones.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">{m.date}</span>
                  <Badge className="text-xs" variant="outline">
                    {m.category}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
