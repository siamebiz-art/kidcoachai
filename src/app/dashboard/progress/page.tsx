"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { DAY_KEYS } from "@/lib/profile-utils";
import type { DayKey, PlanActivity } from "@/lib/types";
import toast from "react-hot-toast";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, Calendar, Plus, Loader2, Sparkles } from "lucide-react";

const catColors: Record<string, string> = {
  ภาษา: "bg-emerald-500", การสื่อสาร: "bg-blue-500",
  การเรียนรู้: "bg-purple-500", สมาธิ: "bg-red-500", กล้ามเนื้อ: "bg-amber-500",
};

const milestoneCategories = ["ภาษา", "การสื่อสาร", "การเรียนรู้", "สมาธิ", "กล้ามเนื้อ", "อื่นๆ"];

export default function ProgressPage() {
  const router = useRouter();
  const {
    isLoaded, childProfile, childAge, latestAssessment, assessmentHistory,
    weeklyPlan, activityLog, milestones, addMilestone,
  } = useProfile();

  const [newEvent, setNewEvent] = useState("");
  const [newCat, setNewCat] = useState("ภาษา");
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Compute real stats from activityLog
  const totalDone = Object.values(activityLog).filter(Boolean).length;
  const activeDays = new Set(
    Object.entries(activityLog)
      .filter(([, v]) => v)
      .map(([k]) => k.split("-")[0])
  ).size;

  // Weekly activity bar data from current plan
  const weeklyBarData = DAY_KEYS.map((dk) => {
    const acts: PlanActivity[] = weeklyPlan ? ((weeklyPlan[dk as DayKey] as PlanActivity[]) ?? []) : [];
    const done = acts.filter((_, i) => activityLog[`${dk}-${i}`]).length;
    return { day: { monday:"จ",tuesday:"อ",wednesday:"พ",thursday:"พฤ",friday:"ศ",saturday:"ส",sunday:"อา" }[dk], กิจกรรม: done };
  });

  // Radar data from assessment
  const radarData = latestAssessment
    ? [
        { subject: "ภาษา",     score: latestAssessment.scores.ภาษา },
        { subject: "สื่อสาร",  score: latestAssessment.scores.การสื่อสาร },
        { subject: "เรียนรู้", score: latestAssessment.scores.การเรียนรู้ },
        { subject: "สมาธิ",   score: latestAssessment.scores.สมาธิ },
        { subject: "กล้ามเนื้อ", score: latestAssessment.scores.กล้ามเนื้อ },
      ]
    : [];

  const scoreProgress = latestAssessment
    ? [
        { label: "ภาษา",        score: latestAssessment.scores.ภาษา,        color: "text-emerald-600" },
        { label: "การสื่อสาร",  score: latestAssessment.scores.การสื่อสาร,  color: "text-blue-600" },
        { label: "การเรียนรู้", score: latestAssessment.scores.การเรียนรู้, color: "text-purple-600" },
        { label: "สมาธิ",       score: latestAssessment.scores.สมาธิ,       color: "text-red-500" },
        { label: "กล้ามเนื้อ",  score: latestAssessment.scores.กล้ามเนื้อ,  color: "text-amber-600" },
      ]
    : [];

  const handleAddMilestone = async () => {
    if (!newEvent.trim()) { toast.error("กรุณากรอกเหตุการณ์"); return; }
    setIsSaving(true);
    try {
      await addMilestone({
        date: new Date().toISOString(),
        event: newEvent.trim(),
        category: newCat,
      });
      setNewEvent("");
      setShowForm(false);
      toast.success("บันทึกความสำเร็จแล้ว!");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ติดตามผลพัฒนาการ</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {childProfile ? `${childProfile.name} • อายุ ${childAge}` : "กรุณาตั้งค่าข้อมูลเด็กก่อน"}
          </p>
        </div>
        {!latestAssessment && (
          <Button
            onClick={() => router.push("/dashboard/assessment")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
            size="sm"
          >
            <Sparkles className="w-4 h-4" /> เริ่มประเมิน
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "คะแนนรวม",      value: latestAssessment ? `${latestAssessment.overall}%` : "—",   change: latestAssessment ? "ผลล่าสุด" : "ยังไม่ได้ประเมิน", icon: "📊" },
          { label: "วันที่ฝึก",     value: `${activeDays} วัน`,  change: "สัปดาห์นี้",      icon: "📅" },
          { label: "กิจกรรมสำเร็จ", value: `${totalDone} ครั้ง`, change: "สัปดาห์นี้",      icon: "✅" },
          { label: "ความสำเร็จ",    value: `${milestones.length} รายการ`, change: "ทั้งหมด",icon: "🏆" },
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

      {!latestAssessment ? (
        <Card className="p-10 border-gray-100 shadow-sm text-center mb-6">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">ยังไม่มีข้อมูลพัฒนาการ</h2>
          <p className="text-gray-500 text-sm mb-4">ทำแบบประเมินพัฒนาการก่อนเพื่อดูกราฟและข้อมูลจริงค่ะ</p>
          <Button onClick={() => router.push("/dashboard/assessment")} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2">
            <Sparkles className="w-4 h-4" /> ทำแบบประเมิน
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          <Card className="p-5 border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-1">ภาพรวมพัฒนาการ</h2>
            <p className="text-xs text-gray-400 mb-3">
              ประเมินเมื่อ {new Date(latestAssessment.date).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar name="คะแนน" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Score Progress Bars */}
          <Card className="p-5 border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">คะแนนรายด้าน</h2>
            <div className="space-y-4">
              {scoreProgress.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Trend Line Chart (multi-assessment history) */}
      {assessmentHistory.length >= 2 && (
        <Card className="p-5 border-gray-100 shadow-sm mb-6">
          <h2 className="font-bold text-gray-900 mb-1">แนวโน้มพัฒนาการ</h2>
          <p className="text-xs text-gray-400 mb-3">เปรียบเทียบผลประเมินทั้ง {assessmentHistory.length} ครั้ง</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={assessmentHistory.map((a) => ({
                date: new Date(a.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
                ภาษา: a.scores.ภาษา,
                สื่อสาร: a.scores.การสื่อสาร,
                เรียนรู้: a.scores.การเรียนรู้,
                สมาธิ: a.scores.สมาธิ,
                กล้ามเนื้อ: a.scores.กล้ามเนื้อ,
              }))}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ภาษา"    stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="สื่อสาร"  stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="เรียนรู้" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="สมาธิ"   stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="กล้ามเนื้อ" stroke="#EC4899" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Weekly Activity Bar */}
      <Card className="p-5 border-gray-100 shadow-sm mb-6">
        <h2 className="font-bold text-gray-900 mb-4">กิจกรรมสำเร็จรายวัน (สัปดาห์นี้)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyBarData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="กิจกรรม" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Milestones */}
      <Card className="p-5 border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            ไทม์ไลน์ความสำเร็จ
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(!showForm)}
            className="border-purple-200 text-purple-700 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            เพิ่มความสำเร็จ
          </Button>
        </div>

        {showForm && (
          <div className="mb-5 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">บันทึกความสำเร็จใหม่</h3>
            <div className="space-y-3">
              <input
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                placeholder="เช่น น้องพูดว่า 'แม่' เป็นครั้งแรก 🥹"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <div className="flex gap-2">
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  {milestoneCategories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <Button
                  onClick={handleAddMilestone}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  บันทึก
                </Button>
              </div>
            </div>
          </div>
        )}

        {milestones.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">🌟</div>
            <p className="text-sm">ยังไม่มีความสำเร็จที่บันทึก<br/>กดเพิ่มความสำเร็จเพื่อบันทึกพัฒนาการของลูกค่ะ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...milestones].reverse().map((m, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${catColors[m.category] || "bg-gray-400"} shrink-0 mt-1`} />
                  {i < milestones.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {new Date(m.date).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}
                    </span>
                    <Badge variant="outline" className="text-xs">{m.category}</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
