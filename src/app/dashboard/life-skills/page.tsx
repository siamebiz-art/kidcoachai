"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, CheckCircle2, Circle, Star, Trophy, Flame, Zap } from "lucide-react";
import toast from "react-hot-toast";

const LS_KEY = "kidocoachai-lifeskills";

type SkillCategory = "selfcare" | "responsibility" | "social" | "healthy" | "confidence";

interface LifeSkill {
  id: string;
  emoji: string;
  title: string;
  category: SkillCategory;
  stars: number;
}

const LIFE_SKILLS: LifeSkill[] = [
  // Self Care
  { id: "brush-morning",   emoji: "🪥", title: "แปรงฟันเช้า",                 category: "selfcare",       stars: 2 },
  { id: "brush-night",     emoji: "🪥", title: "แปรงฟันก่อนนอน",              category: "selfcare",       stars: 2 },
  { id: "shower",          emoji: "🛁", title: "อาบน้ำ",                       category: "selfcare",       stars: 2 },
  { id: "dress-self",      emoji: "👕", title: "แต่งตัวเอง",                   category: "selfcare",       stars: 2 },
  { id: "wash-hands",      emoji: "🧼", title: "ล้างมือก่อนกินข้าว",           category: "selfcare",       stars: 1 },
  { id: "drink-water",     emoji: "💧", title: "ดื่มน้ำวันนี้",                category: "selfcare",       stars: 1 },
  { id: "sleep-time",      emoji: "😴", title: "เข้านอนตรงเวลา",              category: "selfcare",       stars: 2 },
  // Responsibility
  { id: "make-bed",        emoji: "🛏️", title: "เก็บที่นอน",                  category: "responsibility", stars: 2 },
  { id: "pack-bag",        emoji: "🎒", title: "จัดกระเป๋าเรียน",             category: "responsibility", stars: 2 },
  { id: "tidy-toys",       emoji: "🧸", title: "เก็บของเล่นเข้าที่",           category: "responsibility", stars: 2 },
  { id: "tidy-books",      emoji: "📚", title: "เก็บหนังสือเข้าชั้น",          category: "responsibility", stars: 2 },
  { id: "tidy-shoes",      emoji: "👟", title: "จัดรองเท้าให้เรียบร้อย",       category: "responsibility", stars: 1 },
  { id: "help-home",       emoji: "🧹", title: "ช่วยงานบ้านง่ายๆ",            category: "responsibility", stars: 3 },
  // Social Skills
  { id: "say-hello",       emoji: "🙏", title: "กล่าวสวัสดีวันนี้",           category: "social",         stars: 1 },
  { id: "say-thanks",      emoji: "🙏", title: "กล่าวขอบคุณ",                 category: "social",         stars: 2 },
  { id: "say-sorry",       emoji: "😔", title: "กล่าวขอโทษเมื่อทำผิด",        category: "social",         stars: 2 },
  { id: "smile",           emoji: "😊", title: "ยิ้มทักทายผู้อื่น",           category: "social",         stars: 1 },
  { id: "share",           emoji: "🤝", title: "แบ่งปันของให้เพื่อน",          category: "social",         stars: 2 },
  { id: "help-others",     emoji: "❤️", title: "ช่วยเหลือผู้อื่น",             category: "social",         stars: 3 },
  // Healthy Habits
  { id: "eat-veggie",      emoji: "🥦", title: "กินผักวันนี้",                 category: "healthy",        stars: 2 },
  { id: "eat-fruit",       emoji: "🍎", title: "กินผลไม้วันนี้",               category: "healthy",        stars: 2 },
  { id: "walk",            emoji: "🚶", title: "เดินออกกำลังกาย",             category: "healthy",        stars: 2 },
  { id: "jump20",          emoji: "🏃", title: "กระโดด 20 ครั้ง",             category: "healthy",        stars: 2 },
  { id: "play-outside",    emoji: "⚽", title: "เล่นกลางแจ้ง",                category: "healthy",        stars: 3 },
  { id: "rest-eyes",       emoji: "👀", title: "พักสายตาจากหน้าจอ",           category: "healthy",        stars: 1 },
  // Confidence Builder
  { id: "introduce",       emoji: "🎤", title: "แนะนำตัวเองให้คนอื่นฟัง",     category: "confidence",     stars: 3 },
  { id: "read-aloud",      emoji: "📖", title: "อ่านออกเสียง",                category: "confidence",     stars: 2 },
  { id: "draw-explain",    emoji: "🎨", title: "วาดรูปและอธิบายให้คนอื่นฟัง", category: "confidence",     stars: 3 },
  { id: "tell-story",      emoji: "💬", title: "เล่าเรื่องวันนี้ให้ Kido ฟัง", category: "confidence",    stars: 3 },
  { id: "try-new",         emoji: "🌟", title: "กล้าลองสิ่งใหม่วันนี้",       category: "confidence",     stars: 3 },
];

const CATEGORIES: Record<SkillCategory, { label: string; icon: string; color: string; bg: string; tab: string }> = {
  selfcare:       { label: "Self Care",       icon: "🫧", color: "text-sky-600",    bg: "bg-sky-50 border-sky-100",      tab: "ดูแลตัวเอง"   },
  responsibility: { label: "รับผิดชอบ",       icon: "⭐", color: "text-purple-600", bg: "bg-purple-50 border-purple-100", tab: "รับผิดชอบ"    },
  social:         { label: "มารยาทสังคม",     icon: "💛", color: "text-amber-600",  bg: "bg-amber-50 border-amber-100",  tab: "มารยาท"       },
  healthy:        { label: "สุขภาพดี",        icon: "💪", color: "text-green-600",  bg: "bg-green-50 border-green-100",  tab: "สุขภาพ"       },
  confidence:     { label: "สร้างความมั่นใจ", icon: "✨", color: "text-pink-600",   bg: "bg-pink-50 border-pink-100",    tab: "มั่นใจ"       },
};

const LEVELS = [
  { name: "Little Helper", min: 0,   emoji: "🌱", color: "text-green-600" },
  { name: "Smart Kid",     min: 30,  emoji: "🌿", color: "text-teal-600"  },
  { name: "Super Kid",     min: 80,  emoji: "🌳", color: "text-blue-600"  },
  { name: "Hero Kid",      min: 150, emoji: "🏅", color: "text-purple-600" },
  { name: "Kido Champion", min: 250, emoji: "👑", color: "text-amber-600" },
];

interface BadgeDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  cond: (done: number, streak: number, total: number) => boolean;
}

const BADGES: BadgeDef[] = [
  { id: "first",    emoji: "🌱", title: "เริ่มต้นดี",     desc: "ทำภารกิจแรก",       cond: (d)        => d >= 1  },
  { id: "five",     emoji: "🌿", title: "กำลังดี",        desc: "ทำ 5+ ภารกิจ",      cond: (d)        => d >= 5  },
  { id: "perfect",  emoji: "🏆", title: "วันสมบูรณ์",     desc: "ทำครบทุกภารกิจ",   cond: (d)        => d >= LIFE_SKILLS.length },
  { id: "streak3",  emoji: "🔥", title: "ติดไฟ!",         desc: "ต่อเนื่อง 3 วัน",   cond: (_, s)     => s >= 3  },
  { id: "streak7",  emoji: "💎", title: "นักสร้างนิสัย",  desc: "ต่อเนื่อง 7 วัน",   cond: (_, s)     => s >= 7  },
  { id: "star50",   emoji: "✨", title: "นักสะสมดาว",     desc: "สะสมดาวครบ 50",    cond: (_, __, t) => t >= 50 },
];

type LSData = Record<string, string[]>;

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayStr(): string {
  return toLocalDate(new Date());
}

function loadData(): LSData {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); }
  catch { return {}; }
}

function saveData(data: LSData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getStreak(data: LSData): number {
  const threshold = 4;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if ((data[toLocalDate(d)] ?? []).length >= threshold) streak++;
    else break;
  }
  return streak;
}

function getTotalStars(data: LSData): number {
  return Object.values(data).reduce((total, completed) =>
    total + completed.reduce((sum, id) => {
      const s = LIFE_SKILLS.find((sk) => sk.id === id);
      return sum + (s?.stars ?? 0);
    }, 0), 0);
}

function getLevel(totalStars: number) {
  return [...LEVELS].reverse().find((l) => totalStars >= l.min) ?? LEVELS[0];
}

function getDailyMissions(date: string): string[] {
  const ids = LIFE_SKILLS.map((s) => s.id);
  let seed = date.split("").reduce((h, c) => ((h * 31) + c.charCodeAt(0)) | 0, 0);
  const rand = () => { seed = ((seed * 1103515245) + 12345) | 0; return (seed >>> 1) / 0x7fffffff; };
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, 3);
}

const CATEGORY_KEYS = Object.keys(CATEGORIES) as SkillCategory[];

export default function LifeSkillsPage() {
  const { childProfile } = useProfile();
  const childName = childProfile?.name ?? "น้อง";

  const [record, setRecord] = useState<LSData>({});
  const [activeTab, setActiveTab] = useState<SkillCategory>("selfcare");

  const today = todayStr();
  const todayDone: string[] = record[today] ?? [];
  const dailyMissionIds = getDailyMissions(today);

  useEffect(() => { setRecord(loadData()); }, []);

  function handleComplete(skill: LifeSkill) {
    if (todayDone.includes(skill.id)) return;
    const updated: LSData = { ...record, [today]: [...todayDone, skill.id] };
    setRecord(updated);
    saveData(updated);

    const isDaily = dailyMissionIds.includes(skill.id);
    const bonus = isDaily ? " +โบนัส!" : "";
    toast.success(`${skill.emoji} เยี่ยม! +${skill.stars}⭐${bonus}`, { icon: "✅" });
  }

  const doneCount     = todayDone.length;
  const streak        = getStreak(record);
  const totalStars    = getTotalStars(record);
  const todayStars    = todayDone.reduce((s, id) => s + (LIFE_SKILLS.find((sk) => sk.id === id)?.stars ?? 0), 0);
  const level         = getLevel(totalStars);
  const nextLevel     = LEVELS[LEVELS.indexOf(level) + 1];
  const levelProgress = nextLevel
    ? Math.round(((totalStars - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const dailyDone       = dailyMissionIds.filter((id) => todayDone.includes(id)).length;
  const dailyComplete   = dailyDone >= dailyMissionIds.length;
  const earnedBadges    = BADGES.filter((b) => b.cond(doneCount, streak, totalStars));
  const tabSkills       = LIFE_SKILLS.filter((s) => s.category === activeTab);
  const catInfo         = CATEGORIES[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pt-2">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🌟 Kido Life Skills™</h1>
            <p className="text-sm text-gray-500">ฝึกทักษะชีวิตประจำวันกับ{childName}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-amber-100 p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-2xl font-black text-amber-500">{todayStars}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">ดาววันนี้</div>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-black text-orange-500">{streak}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">วันต่อเนื่อง</div>
          </div>
          <div className="bg-white rounded-2xl border border-purple-100 p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-black text-purple-500">{totalStars}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">ดาวสะสม</div>
          </div>
        </div>

        {/* Level card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{level.emoji}</span>
              <div>
                <p className={`font-black text-sm ${level.color}`}>{level.name}</p>
                <p className="text-[10px] text-gray-400">{nextLevel ? `ถัดไป: ${nextLevel.name} (${nextLevel.min - totalStars} ⭐)` : "ถึงระดับสูงสุดแล้ว! 👑"}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-500">{totalStars} ⭐</span>
          </div>
          {nextLevel && (
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Daily Mission */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kido-point.png" alt="Kido" className="w-8 h-8 object-contain" />
            <div>
              <p className="font-black text-sm text-indigo-800">ภารกิจวันนี้จาก Kido</p>
              <p className="text-[10px] text-indigo-400">{dailyDone}/{dailyMissionIds.length} สำเร็จ{dailyComplete ? " 🎉" : ""}</p>
            </div>
          </div>
          <div className="space-y-2">
            {dailyMissionIds.map((id) => {
              const skill = LIFE_SKILLS.find((s) => s.id === id)!;
              const done  = todayDone.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => handleComplete(skill)}
                  disabled={done}
                  className={`w-full p-3 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
                    done ? "bg-green-50 border-green-200" : "bg-white border-indigo-100 hover:border-indigo-300 active:scale-[0.98]"
                  }`}
                >
                  <span className="text-xl">{skill.emoji}</span>
                  <span className={`flex-1 text-sm font-semibold ${done ? "text-green-700 line-through" : "text-gray-800"}`}>
                    {skill.title}
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold">+{skill.stars}⭐</span>
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    : <Circle className="w-5 h-5 text-gray-200 shrink-0" />}
                </button>
              );
            })}
          </div>
          {dailyComplete && (
            <div className="mt-3 text-center bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl py-2">
              <p className="text-white font-black text-sm">🎉 ทำครบภารกิจวันนี้แล้ว!</p>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_KEYS.map((key) => {
            const cat  = CATEGORIES[key];
            const done = LIFE_SKILLS.filter((s) => s.category === key && todayDone.includes(s.id)).length;
            const total = LIFE_SKILLS.filter((s) => s.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap border-2 transition-all shrink-0 ${
                  activeTab === key
                    ? `${cat.bg} ${cat.color} border-current`
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.tab}</span>
                {done > 0 && (
                  <span className={`text-[9px] font-black px-1 rounded-full ${activeTab === key ? "bg-white/60" : "bg-gray-100"}`}>
                    {done}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mission cards for active tab */}
        <div className="space-y-2 mb-5">
          <p className="text-xs text-gray-400 px-1 mb-2">
            {catInfo.icon} {catInfo.label} — แตะเพื่อทำภารกิจ
          </p>
          {tabSkills.map((skill) => {
            const done    = todayDone.includes(skill.id);
            const isDaily = dailyMissionIds.includes(skill.id);
            return (
              <button
                key={skill.id}
                onClick={() => handleComplete(skill)}
                disabled={done}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${
                  done
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 active:scale-[0.98]"
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xl">{skill.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${done ? "text-green-700 line-through" : "text-gray-900"}`}>
                    {skill.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isDaily && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                        📋 ภารกิจวันนี้
                      </span>
                    )}
                    <span className="text-[10px] text-amber-500 font-bold">+{skill.stars}⭐</span>
                    {done && <span className="text-[10px] text-green-600 font-bold">✓ ทำแล้ว!</span>}
                  </div>
                </div>
                {done
                  ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  : <Circle className="w-6 h-6 text-gray-200 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-5">
          <h2 className="font-bold text-gray-800 mb-3 text-sm">🏅 ความสำเร็จ</h2>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.map((badge) => {
              const earned = badge.cond(doneCount, streak, totalStars);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
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
          {earnedBadges.length > 0 && (
            <p className="text-[10px] text-center text-amber-600 font-bold mt-3">
              ✨ ได้รับ {earnedBadges.length}/{BADGES.length} รางวัลแล้ว!
            </p>
          )}
        </div>

        {/* Celebration */}
        {doneCount >= LIFE_SKILLS.length && (
          <div className="bg-gradient-to-r from-amber-400 to-green-500 rounded-3xl p-5 text-center shadow-lg">
            <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
            <p className="text-white font-black text-lg">เก่งมาก{childName}! 🎉</p>
            <p className="text-white/80 text-sm mt-1">ทำครบทุกภารกิจวันนี้แล้ว</p>
            {streak > 1 && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-white" />
                <p className="text-white/90 text-sm font-bold">ต่อเนื่อง {streak} วัน!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
