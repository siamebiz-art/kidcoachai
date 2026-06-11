"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Star, Clock, Filter } from "lucide-react";

const categories = ["ทั้งหมด", "ภาษา", "การสื่อสาร", "สมาธิ", "กล้ามเนื้อ", "การเรียนรู้"];

const activities = [
  {
    id: 1,
    title: "เกมชี้รูปภาพ",
    category: "ภาษา",
    duration: "10 นาที",
    age: "2-6 ปี",
    difficulty: "ง่าย",
    emoji: "👆",
    color: "from-orange-400 to-amber-500",
    description: "ฝึกให้เด็กชี้และบอกชื่อสิ่งของในภาพ พัฒนาคลังคำศัพท์และการรับรู้ภาษา",
    starred: true,
    materials: ["บัตรรูปภาพ", "หนังสือนิทานมีรูป"],
  },
  {
    id: 2,
    title: "บัตรคำศัพท์",
    category: "ภาษา",
    duration: "10 นาที",
    age: "2-8 ปี",
    difficulty: "ง่าย",
    emoji: "🃏",
    color: "from-blue-400 to-cyan-500",
    description: "ใช้บัตรรูปสัตว์ ผลไม้ หรือสิ่งของในชีวิตประจำวัน ฝึกพูดชื่อตาม",
    starred: true,
    materials: ["บัตรคำศัพท์", "สัตว์โมเดล"],
  },
  {
    id: 3,
    title: "นิทานพัฒนาภาษา",
    category: "ภาษา",
    duration: "10-15 นาที",
    age: "1-8 ปี",
    difficulty: "ง่าย",
    emoji: "📖",
    color: "from-pink-400 to-rose-500",
    description: "อ่านนิทานพร้อมชี้รูป ตั้งคำถามง่ายๆ กระตุ้นให้เด็กตอบและเล่าตาม",
    starred: true,
    materials: ["หนังสือนิทาน"],
  },
  {
    id: 4,
    title: "เกมจับคู่ภาพ",
    category: "การเรียนรู้",
    duration: "10 นาที",
    age: "3-7 ปี",
    difficulty: "ปานกลาง",
    emoji: "🧩",
    color: "from-purple-400 to-violet-500",
    description: "จับคู่รูปภาพที่เหมือนกัน ฝึกความจำ การสังเกต และสมาธิ",
    starred: false,
    materials: ["บัตรรูปคู่"],
  },
  {
    id: 5,
    title: "เกมเลียนแบบท่าทาง",
    category: "การสื่อสาร",
    duration: "10 นาที",
    age: "1-6 ปี",
    difficulty: "ง่าย",
    emoji: "🤸",
    color: "from-green-400 to-emerald-500",
    description: "ผู้ปกครองทำท่าทางให้เด็กเลียนแบบ เช่น โบกมือ ปรบมือ ส่งเสริมการสื่อสารไม่ใช้คำพูด",
    starred: false,
    materials: ["ไม่ต้องใช้อุปกรณ์"],
  },
  {
    id: 6,
    title: "ร้องเพลงพร้อมท่าทาง",
    category: "ภาษา",
    duration: "5-10 นาที",
    age: "1-6 ปี",
    difficulty: "ง่าย",
    emoji: "🎵",
    color: "from-yellow-400 to-orange-500",
    description: "ร้องเพลงเด็กง่ายๆ พร้อมท่าทางประกอบ เช่น หัวไหล่เข่าเท้า พัฒนาภาษาและกล้ามเนื้อ",
    starred: false,
    materials: ["เพลงเด็ก (YouTube)"],
  },
  {
    id: 7,
    title: "เกมฝึกสมาธิ Puzzle",
    category: "สมาธิ",
    duration: "10-15 นาที",
    age: "3-8 ปี",
    difficulty: "ปานกลาง",
    emoji: "🎯",
    color: "from-red-400 to-rose-500",
    description: "ต่อ Puzzle ชิ้นเล็กๆ ฝึกสมาธิ ความอดทน และการแก้ปัญหา",
    starred: false,
    materials: ["Puzzle 4-12 ชิ้น"],
  },
  {
    id: 8,
    title: "ระบายสี",
    category: "กล้ามเนื้อ",
    duration: "15 นาที",
    age: "2-8 ปี",
    difficulty: "ง่าย",
    emoji: "🎨",
    color: "from-indigo-400 to-purple-500",
    description: "ระบายสีในแบบที่กำหนด ฝึกกล้ามเนื้อมัดเล็ก การจับดินสอ และสมาธิ",
    starred: false,
    materials: ["สีเทียน", "กระดาษระบายสี"],
  },
];

const difficultyColor: Record<string, string> = {
  ง่าย: "bg-green-100 text-green-700",
  ปานกลาง: "bg-amber-100 text-amber-700",
  ยาก: "bg-red-100 text-red-600",
};

export default function ActivitiesPage() {
  const [selectedCat, setSelectedCat] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof activities)[0] | null>(null);

  const filtered = activities.filter(
    (a) =>
      (selectedCat === "ทั้งหมด" || a.category === selectedCat) &&
      (search === "" || a.title.includes(search) || a.description.includes(search))
  );

  if (selected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          ← กลับ
        </button>

        <div className={`w-full h-40 rounded-3xl bg-gradient-to-br ${selected.color} flex items-center justify-center mb-6`}>
          <span className="text-7xl">{selected.emoji}</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{selected.title}</h1>
          <Badge className={difficultyColor[selected.difficulty]}>{selected.difficulty}</Badge>
        </div>

        <div className="flex gap-3 mb-6">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {selected.duration}
          </Badge>
          <Badge variant="outline">อายุ {selected.age}</Badge>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">{selected.category}</Badge>
        </div>

        <Card className="p-5 mb-4 border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-2">รายละเอียดกิจกรรม</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
        </Card>

        <Card className="p-5 mb-6 border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">อุปกรณ์ที่ต้องใช้</h3>
          <ul className="space-y-1.5">
            {selected.materials.map((m) => (
              <li key={m} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </Card>

        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl py-6 text-base">
          เริ่มกิจกรรม
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คลังกิจกรรม</h1>
        <p className="text-gray-500 text-sm mt-0.5">กิจกรรมพัฒนาการ {activities.length}+ รายการ</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหากิจกรรม..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
              selectedCat === cat
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((act) => (
          <Card
            key={act.id}
            onClick={() => setSelected(act)}
            className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className={`h-28 bg-gradient-to-br ${act.color} flex items-center justify-center`}>
              <span className="text-5xl">{act.emoji}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">{act.title}</h3>
                {act.starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                {act.description}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] py-0">
                  {act.category}
                </Badge>
                <Badge variant="outline" className="text-[10px] py-0 gap-1">
                  <Clock className="w-3 h-3" />
                  {act.duration}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>ไม่พบกิจกรรมที่ค้นหา</p>
        </div>
      )}
    </div>
  );
}
