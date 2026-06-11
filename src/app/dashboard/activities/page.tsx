"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { Search, Star, Clock, CheckCircle2, Sparkles, Gamepad2 } from "lucide-react";
import toast from "react-hot-toast";
import { FlashcardGame } from "./flashcard-game";
import { MemoryMatchGame } from "./memory-game";
import { PictureQuizGame } from "./picture-quiz";
import { CountingGame } from "./counting-game";
import { SortingGame } from "./sorting-game";

const categories = ["ทั้งหมด", "ภาษา", "การสื่อสาร", "สมาธิ", "กล้ามเนื้อ", "การเรียนรู้"];

const ACTIVITIES = [
  { id: 1, title: "เกมชี้รูปภาพ",         category: "ภาษา",        duration: "10 นาที",    age: "2-6 ปี",  difficulty: "ง่าย",     emoji: "👆", color: "from-orange-400 to-amber-500",  description: "ดูคำแล้วแตะรูปที่ถูกต้อง ฝึกการเชื่อมคำกับภาพ พัฒนาคลังคำศัพท์",                starred: true,  materials: [],                                   interactive: "picture-quiz" as const },
  { id: 2, title: "บัตรคำศัพท์",           category: "ภาษา",        duration: "10 นาที",    age: "2-8 ปี",  difficulty: "ง่าย",     emoji: "🃏", color: "from-blue-400 to-cyan-500",     description: "แตะการ์ดเพื่อพลิกดูคำ ฝึกจำคำศัพท์สัตว์ ผลไม้ และสิ่งของรอบตัว",                   starred: true,  materials: [],                                   interactive: "flashcard" as const },
  { id: 3, title: "นิทานพัฒนาภาษา",        category: "ภาษา",        duration: "10-15 นาที", age: "1-8 ปี",  difficulty: "ง่าย",     emoji: "📖", color: "from-pink-400 to-rose-500",     description: "อ่านนิทานพร้อมชี้รูป ตั้งคำถามง่ายๆ กระตุ้นให้เด็กตอบและเล่าตาม",                   starred: true,  materials: ["หนังสือนิทาน"],                     interactive: null },
  { id: 4, title: "เกมจับคู่ภาพ",          category: "การเรียนรู้", duration: "10 นาที",    age: "3-7 ปี",  difficulty: "ปานกลาง", emoji: "🧩", color: "from-purple-400 to-violet-500", description: "พลิกการ์ดบนหน้าจอเพื่อหาคู่ที่เหมือนกัน ฝึกความจำและสมาธิ",                         starred: false, materials: [],                                   interactive: "memory" as const },
  { id: 5, title: "เกมเลียนแบบท่าทาง",     category: "การสื่อสาร", duration: "10 นาที",    age: "1-6 ปี",  difficulty: "ง่าย",     emoji: "🤸", color: "from-green-400 to-emerald-500", description: "ผู้ปกครองทำท่าทางให้เด็กเลียนแบบ เช่น โบกมือ ปรบมือ ส่งเสริมการสื่อสาร",           starred: false, materials: ["ไม่ต้องใช้อุปกรณ์"],               interactive: null },
  { id: 6, title: "ร้องเพลงพร้อมท่าทาง",   category: "ภาษา",        duration: "5-10 นาที",  age: "1-6 ปี",  difficulty: "ง่าย",     emoji: "🎵", color: "from-yellow-400 to-orange-500", description: "ร้องเพลงเด็กง่ายๆ พร้อมท่าทางประกอบ เช่น หัวไหล่เข่าเท้า พัฒนาภาษาและกล้ามเนื้อ", starred: false, materials: ["เพลงเด็ก (YouTube)"],               interactive: null },
  { id: 7, title: "เกมนับจำนวน",           category: "การเรียนรู้", duration: "10 นาที",    age: "2-6 ปี",  difficulty: "ง่าย",     emoji: "🔢", color: "from-red-400 to-rose-500",      description: "นับของแล้วแตะตัวเลขที่ถูกต้อง ฝึกทักษะตัวเลขและการนับ",                           starred: false, materials: [],                                   interactive: "counting" as const },
  { id: 8, title: "ระบายสี",                category: "กล้ามเนื้อ", duration: "15 นาที",    age: "2-8 ปี",  difficulty: "ง่าย",     emoji: "🎨", color: "from-indigo-400 to-purple-500", description: "ระบายสีในแบบที่กำหนด ฝึกกล้ามเนื้อมัดเล็ก การจับดินสอ และสมาธิ",                   starred: false, materials: ["สีเทียน", "กระดาษระบายสี"],         interactive: null },
  { id: 9, title: "เกมจัดหมวดหมู่",        category: "การเรียนรู้", duration: "10 นาที",    age: "3-7 ปี",  difficulty: "ง่าย",     emoji: "🗂️", color: "from-teal-400 to-green-500",    description: "แยกสิ่งของใส่หมวดหมู่ที่ถูกต้อง ฝึกการคิดแบบจัดกลุ่มและแยกแยะ",                  starred: false, materials: [],                                   interactive: "sorting" as const },
];

const difficultyColor: Record<string, string> = {
  ง่าย: "bg-green-100 text-green-700",
  ปานกลาง: "bg-amber-100 text-amber-700",
  ยาก: "bg-red-100 text-red-600",
};

type Activity = (typeof ACTIVITIES)[0];

export default function ActivitiesPage() {
  const { latestAssessment, activityLog, toggleActivity } = useProfile();
  const [selectedCat, setSelectedCat] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Activity | null>(null);
  const [completing, setCompleting] = useState(false);

  // Find weak areas (score < 60)
  const weakCategories = latestAssessment
    ? (Object.entries(latestAssessment.scores) as [string, number][])
        .filter(([, v]) => v < 60)
        .map(([k]) => k)
    : [];

  const recommended = ACTIVITIES.filter((a) => weakCategories.includes(a.category));

  const filtered = ACTIVITIES.filter(
    (a) =>
      (selectedCat === "ทั้งหมด" || a.category === selectedCat) &&
      (search === "" || a.title.includes(search) || a.description.includes(search))
  );

  const isDone = (id: number) => !!activityLog[`lib-${id}`];

  const handleComplete = async (act: Activity) => {
    setCompleting(true);
    try {
      await toggleActivity(`lib-${act.id}`);
      if (!isDone(act.id)) {
        toast.success(`บันทึก "${act.title}" เสร็จแล้ว! 🎉`);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setCompleting(false);
    }
  };

  if (selected?.interactive === "flashcard") {
    return (
      <FlashcardGame
        onBack={() => setSelected(null)}
        onComplete={() => handleComplete(selected)}
      />
    );
  }

  if (selected?.interactive === "memory") {
    return (
      <MemoryMatchGame
        onBack={() => setSelected(null)}
        onComplete={() => handleComplete(selected)}
      />
    );
  }

  if (selected?.interactive === "picture-quiz") {
    return (
      <PictureQuizGame
        onBack={() => setSelected(null)}
        onComplete={() => handleComplete(selected)}
      />
    );
  }

  if (selected?.interactive === "counting") {
    return (
      <CountingGame
        onBack={() => setSelected(null)}
        onComplete={() => handleComplete(selected)}
      />
    );
  }

  if (selected?.interactive === "sorting") {
    return (
      <SortingGame
        onBack={() => setSelected(null)}
        onComplete={() => handleComplete(selected)}
      />
    );
  }

  if (selected) {
    const done = isDone(selected.id);
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

        <div className="flex gap-3 mb-6 flex-wrap">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {selected.duration}
          </Badge>
          <Badge variant="outline">อายุ {selected.age}</Badge>
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">{selected.category}</Badge>
          {weakCategories.includes(selected.category) && (
            <Badge className="bg-rose-100 text-rose-700 border-rose-200 gap-1">
              <Sparkles className="w-3 h-3" /> แนะนำสำหรับลูก
            </Badge>
          )}
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

        <Button
          onClick={() => handleComplete(selected)}
          disabled={completing}
          className={`w-full rounded-2xl py-6 text-base border-0 gap-2 transition-all ${
            done
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          }`}
        >
          {done ? (
            <><CheckCircle2 className="w-5 h-5" /> ทำเสร็จแล้ว ✓</>
          ) : (
            "บันทึกว่าทำเสร็จแล้ว"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คลังกิจกรรม</h1>
        <p className="text-gray-500 text-sm mt-0.5">กิจกรรมพัฒนาการ {ACTIVITIES.length}+ รายการ</p>
      </div>

      {/* Recommended section */}
      {recommended.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h2 className="font-semibold text-gray-900 text-sm">แนะนำสำหรับลูก</h2>
            <span className="text-xs text-gray-400">ด้านที่ควรพัฒนา: {weakCategories.join(", ")}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommended.map((act) => (
              <ActivityCard
                key={act.id}
                act={act}
                done={isDone(act.id)}
                highlighted
                onClick={() => setSelected(act)}
              />
            ))}
          </div>
        </div>
      )}

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
          <ActivityCard
            key={act.id}
            act={act}
            done={isDone(act.id)}
            highlighted={false}
            onClick={() => setSelected(act)}
          />
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

function ActivityCard({
  act,
  done,
  highlighted,
  onClick,
}: {
  act: Activity;
  done: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative ${
        highlighted ? "ring-2 ring-rose-300" : ""
      }`}
    >
      {done && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow" />
        </div>
      )}
      <div className={`h-28 bg-gradient-to-br ${act.color} flex items-center justify-center`}>
        <span className="text-5xl">{act.emoji}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm">{act.title}</h3>
          {act.starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{act.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] py-0">
            {act.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] py-0 gap-1">
            <Clock className="w-3 h-3" />
            {act.duration}
          </Badge>
          {act.interactive && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] py-0 gap-1">
              <Gamepad2 className="w-3 h-3" /> เล่นได้เลย
            </Badge>
          )}
          {highlighted && (
            <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] py-0">แนะนำ</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
