"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { Search, BookOpen, Play, Clock, Bookmark, Sparkles } from "lucide-react";

const ARTICLES = [
  { id: 1, title: "5 สัญญาณเตือนที่บ่งบอกว่าลูกอาจพูดช้า",     category: "ภาษา",          type: "บทawesome", readTime: "5 นาที",  emoji: "💬", color: "bg-emerald-50 border-emerald-100", badgeColor: "bg-emerald-100 text-emerald-700", summary: "เรียนรู้สัญญาณเตือนและวิธีช่วยลูกพัฒนาทักษะภาษาที่บ้าน",                              diagnosisKeys: ["speech_delay", "global_delay"] },
  { id: 2, title: "เทคนิค Floor Time: เล่นกับลูกอย่างมีความหมาย", category: "การสื่อสาร",    type: "คู่มือ",     readTime: "8 นาที",  emoji: "🤝", color: "bg-blue-50 border-blue-100",       badgeColor: "bg-blue-100 text-blue-700",       summary: "วิธีเล่นกับลูกที่ช่วยพัฒนาการสื่อสาร อารมณ์ และสมาธิ",                                diagnosisKeys: ["autism", "speech_delay", "global_delay"] },
  { id: 3, title: "ABA Therapy คืออะไร ผู้ปกครองทำเองได้ไหม?",   category: "ออทิสติก",      type: "บทความ",     readTime: "10 นาที", emoji: "🧩", color: "bg-purple-50 border-purple-100",   badgeColor: "bg-purple-100 text-purple-700",   summary: "ทำความเข้าใจ Applied Behavior Analysis และวิธีประยุกต์ใช้ที่บ้าน",                    diagnosisKeys: ["autism"] },
  { id: 4, title: "วิธีจัดการลูกที่มีพฤติกรรม Meltdown",          category: "ADHD",           type: "คู่มือ",     readTime: "7 นาที",  emoji: "🌊", color: "bg-red-50 border-red-100",         badgeColor: "bg-red-100 text-red-600",         summary: "เทคนิครับมือและป้องกัน emotional meltdown ในเด็กพิเศษ",                               diagnosisKeys: ["adhd", "autism"] },
  { id: 5, title: "สอนลูกพูด: 10 กิจกรรมที่ทำได้ทุกวัน",          category: "ภาษา",          type: "วิดีโอ",     readTime: "15 นาที", emoji: "🎬", color: "bg-amber-50 border-amber-100",     badgeColor: "bg-amber-100 text-amber-700",     summary: "กิจกรรมฝึกพูดง่ายๆ ที่ผู้ปกครองทำกับลูกได้ทุกวันที่บ้าน",                            diagnosisKeys: ["speech_delay", "global_delay"] },
  { id: 6, title: "ดาวน์ซินโดรม: แผนพัฒนาการตามอายุ",             category: "ดาวน์ซินโดรม", type: "คู่มือ",     readTime: "12 นาที", emoji: "⭐", color: "bg-pink-50 border-pink-100",       badgeColor: "bg-pink-100 text-pink-700",       summary: "แนวทางพัฒนาการเด็กดาวน์ซินโดรมตั้งแต่แรกเกิดถึง 12 ปี",                              diagnosisKeys: ["down_syndrome"] },
];

const categories = ["ทั้งหมด", "ภาษา", "การสื่อสาร", "ออทิสติก", "ADHD", "ดาวน์ซินโดรม"];

const typeIcons: Record<string, React.ReactNode> = {
  บทความ: <BookOpen className="w-3.5 h-3.5" />,
  คู่มือ: <BookOpen className="w-3.5 h-3.5" />,
  วิดีโอ: <Play className="w-3.5 h-3.5" />,
};

export default function KnowledgePage() {
  const { childProfile, bookmarkedArticles, toggleBookmark } = useProfile();
  const [cat, setCat] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const diagnosisKey = childProfile?.diagnosisKey ?? "";

  // Articles recommended based on diagnosis
  const recommended = ARTICLES.filter(
    (a) => diagnosisKey && a.diagnosisKeys.includes(diagnosisKey)
  );

  const filtered = ARTICLES.filter(
    (a) =>
      (cat === "ทั้งหมด" || a.category === cat) &&
      (search === "" || a.title.includes(search) || a.summary.includes(search))
  );

  const handleBookmark = async (e: React.MouseEvent, articleId: number) => {
    e.stopPropagation();
    setSavingId(articleId);
    try {
      await toggleBookmark(articleId);
    } finally {
      setSavingId(null);
    }
  };

  const isBookmarked = (id: number) => bookmarkedArticles.includes(id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คลังความรู้ผู้ปกครอง</h1>
        <p className="text-gray-500 text-sm mt-0.5">บทความ คู่มือ และวิดีโอ โดยผู้เชี่ยวชาญด้านพัฒนาการเด็ก</p>
      </div>

      {/* Personalized recommendation section */}
      {recommended.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-gray-900 text-sm">
              แนะนำสำหรับ{childProfile?.diagnosisLabel ?? "ลูก"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recommended.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                bookmarked={isBookmarked(article.id)}
                saving={savingId === article.id}
                highlighted
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {bookmarkedArticles.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">บันทึกไว้อ่าน</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {ARTICLES.filter((a) => bookmarkedArticles.includes(a.id)).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                bookmarked
                saving={savingId === article.id}
                highlighted={false}
                onBookmark={handleBookmark}
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
          <ArticleCard
            key={article.id}
            article={article}
            bookmarked={isBookmarked(article.id)}
            saving={savingId === article.id}
            highlighted={false}
            onBookmark={handleBookmark}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📚</div>
          <p>ไม่พบบทความที่ค้นหา</p>
        </div>
      )}
    </div>
  );
}

type Article = (typeof ARTICLES)[0];

function ArticleCard({
  article,
  bookmarked,
  saving,
  highlighted,
  onBookmark,
}: {
  article: Article;
  bookmarked: boolean;
  saving: boolean;
  highlighted: boolean;
  onBookmark: (e: React.MouseEvent, id: number) => void;
}) {
  return (
    <Card
      className={`p-5 border cursor-pointer hover:shadow-md transition-shadow relative ${article.color} ${
        highlighted ? "ring-2 ring-purple-300" : ""
      }`}
    >
      <button
        onClick={(e) => onBookmark(e, article.id)}
        disabled={saving}
        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/50 transition-colors"
        aria-label={bookmarked ? "ยกเลิกบันทึก" : "บันทึก"}
      >
        <Bookmark
          className={`w-4 h-4 transition-colors ${
            bookmarked ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"
          }`}
        />
      </button>

      <div className="flex items-start gap-4 pr-6">
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
            {highlighted && (
              <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 py-0 gap-1">
                <Sparkles className="w-3 h-3" /> แนะนำ
              </Badge>
            )}
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
  );
}
