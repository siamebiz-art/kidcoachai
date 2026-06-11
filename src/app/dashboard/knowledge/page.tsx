"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Play, Clock } from "lucide-react";

const articles = [
  {
    id: 1,
    title: "5 สัญญาณเตือนที่บ่งบอกว่าลูกอาจพูดช้า",
    category: "ภาษา",
    type: "บทความ",
    readTime: "5 นาที",
    emoji: "💬",
    color: "bg-emerald-50 border-emerald-100",
    badgeColor: "bg-emerald-100 text-emerald-700",
    summary: "เรียนรู้สัญญาณเตือนและวิธีช่วยลูกพัฒนาทักษะภาษาที่บ้าน",
  },
  {
    id: 2,
    title: "เทคนิค Floor Time: เล่นกับลูกอย่างมีความหมาย",
    category: "การสื่อสาร",
    type: "คู่มือ",
    readTime: "8 นาที",
    emoji: "🤝",
    color: "bg-blue-50 border-blue-100",
    badgeColor: "bg-blue-100 text-blue-700",
    summary: "วิธีเล่นกับลูกที่ช่วยพัฒนาการสื่อสาร อารมณ์ และสมาธิ",
  },
  {
    id: 3,
    title: "ABA Therapy คืออะไร ผู้ปกครองทำเองได้ไหม?",
    category: "ออทิสติก",
    type: "บทความ",
    readTime: "10 นาที",
    emoji: "🧩",
    color: "bg-purple-50 border-purple-100",
    badgeColor: "bg-purple-100 text-purple-700",
    summary: "ทำความเข้าใจ Applied Behavior Analysis และวิธีประยุกต์ใช้ที่บ้าน",
  },
  {
    id: 4,
    title: "วิธีจัดการลูกที่มีพฤติกรรม Meltdown",
    category: "ADHD",
    type: "คู่มือ",
    readTime: "7 นาที",
    emoji: "🌊",
    color: "bg-red-50 border-red-100",
    badgeColor: "bg-red-100 text-red-600",
    summary: "เทคนิครับมือและป้องกัน emotional meltdown ในเด็กพิเศษ",
  },
  {
    id: 5,
    title: "สอนลูกพูด: 10 กิจกรรมที่ทำได้ทุกวัน",
    category: "ภาษา",
    type: "วิดีโอ",
    readTime: "15 นาที",
    emoji: "🎬",
    color: "bg-amber-50 border-amber-100",
    badgeColor: "bg-amber-100 text-amber-700",
    summary: "กิจกรรมฝึกพูดง่ายๆ ที่ผู้ปกครองทำกับลูกได้ทุกวันที่บ้าน",
  },
  {
    id: 6,
    title: "ดาวน์ซินโดรม: แผนพัฒนาการตามอายุ",
    category: "ดาวน์ซินโดรม",
    type: "คู่มือ",
    readTime: "12 นาที",
    emoji: "⭐",
    color: "bg-pink-50 border-pink-100",
    badgeColor: "bg-pink-100 text-pink-700",
    summary: "แนวทางพัฒนาการเด็กดาวน์ซินโดรมตั้งแต่แรกเกิดถึง 12 ปี",
  },
];

const categories = ["ทั้งหมด", "ภาษา", "การสื่อสาร", "ออทิสติก", "ADHD", "ดาวน์ซินโดรม"];
const typeIcons: Record<string, React.ReactNode> = {
  บทความ: <BookOpen className="w-3.5 h-3.5" />,
  คู่มือ: <BookOpen className="w-3.5 h-3.5" />,
  วิดีโอ: <Play className="w-3.5 h-3.5" />,
};

export default function KnowledgePage() {
  const [cat, setCat] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");

  const filtered = articles.filter(
    (a) =>
      (cat === "ทั้งหมด" || a.category === cat) &&
      (search === "" || a.title.includes(search))
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คลังความรู้ผู้ปกครอง</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          บทความ คู่มือ และวิดีโอ โดยผู้เชี่ยวชาญด้านพัฒนาการเด็ก
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาบทความ..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
        />
      </div>

      {/* Category */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
              cat === c
                ? "bg-purple-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((article) => (
          <Card
            key={article.id}
            className={`p-5 border cursor-pointer hover:shadow-md transition-shadow ${article.color}`}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl shrink-0">{article.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className={`text-xs ${article.badgeColor} border-0`}>
                    {article.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1 py-0">
                    {typeIcons[article.type]}
                    {article.type}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                  {article.summary}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
