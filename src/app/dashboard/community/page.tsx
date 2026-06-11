"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Plus, Flame } from "lucide-react";

const posts = [
  {
    id: 1,
    author: "คุณแม่ปุ้ย",
    avatar: "ปุ้ย",
    time: "2 ชั่วโมงที่แล้ว",
    tag: "แชร์ประสบการณ์",
    tagColor: "bg-green-100 text-green-700",
    content:
      "วันนี้น้องออมพูดว่า 'แม่ ขอน้ำ' เป็นประโยคแรก!!!! ดีใจมากเลยค่ะ ฝึกมา 3 เดือน ใช้กิจกรรมบัตรคำศัพท์และเกมชี้รูปทุกวัน ขอบคุณ AI Coach มากๆ ที่แนะนำ 🥹💜",
    likes: 47,
    comments: 12,
    liked: false,
  },
  {
    id: 2,
    author: "คุณพ่อโน้ต",
    avatar: "โน้ต",
    time: "4 ชั่วโมงที่แล้ว",
    tag: "ขอคำแนะนำ",
    tagColor: "bg-blue-100 text-blue-700",
    content:
      "ลูกชาย 5 ขวบ ออทิสติกระดับเบา ชอบ meltdown ตอนต้องออกจากกิจกรรมที่ชอบ มีใครมีวิธีรับมือบ้างไหมครับ? ลองทำ timer แล้วแต่ยังไม่ค่อยได้ผล",
    likes: 23,
    comments: 18,
    liked: true,
  },
  {
    id: 3,
    author: "คุณแม่กุ้ง",
    avatar: "กุ้ง",
    time: "6 ชั่วโมงที่แล้ว",
    tag: "รีวิวกิจกรรม",
    tagColor: "bg-purple-100 text-purple-700",
    content:
      "ลองเกม Floor Time ตามที่คู่มือแนะนำ 4 สัปดาห์แล้วค่ะ น้องสาวเริ่มมองหน้าและยิ้มตอบมากขึ้นมาก ก่อนหน้านี้แทบไม่สบตาเลย แนะนำมากค่ะ ⭐⭐⭐⭐⭐",
    likes: 61,
    comments: 8,
    liked: false,
  },
  {
    id: 4,
    author: "คุณแม่แนน",
    avatar: "แนน",
    time: "เมื่อวาน",
    tag: "แชร์ประสบการณ์",
    tagColor: "bg-green-100 text-green-700",
    content:
      "เคล็ดลับจากที่บ้านค่ะ ใช้เวลาอาบน้ำ กินข้าว ฝึกคำศัพท์ไปด้วยเลย ไม่ต้องนั่งฝึกแบบเป็นทางการ เด็กจะไม่เบื่อและสนุกกว่ามากค่ะ 😊",
    likes: 89,
    comments: 24,
    liked: false,
  },
];

const badges = [
  { emoji: "🔥", label: "ฝึก 7 วัน", done: true },
  { emoji: "⭐", label: "กิจกรรมแรก", done: true },
  { emoji: "🏆", label: "ฝึก 30 วัน", done: false },
  { emoji: "💜", label: "แชร์ 1 ครั้ง", done: false },
];

export default function CommunityPage() {
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ชุมชนผู้ปกครอง</h1>
          <p className="text-gray-500 text-sm mt-0.5">แบ่งปัน เรียนรู้ และให้กำลังใจกัน</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          โพสต์ใหม่
        </Button>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        {/* Feed */}
        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = liked[post.id] ?? post.liked;
            return (
              <Card key={post.id} className="p-5 border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-sm font-bold">
                      {post.avatar[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{post.author}</div>
                    <div className="text-xs text-gray-400">{post.time}</div>
                  </div>
                  <Badge className={`ml-auto text-xs ${post.tagColor} border-0`}>
                    {post.tag}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setLiked((prev) => ({ ...prev, [post.id]: !isLiked }))}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-pink-500" : ""}`} />
                    {post.likes + (isLiked && !post.liked ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-500 transition-colors ml-auto">
                    <Share2 className="w-4 h-4" />
                    แชร์
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Streak */}
          <Card className="p-5 border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              สายฝึกของคุณ
            </h3>
            <div className="text-4xl font-bold text-orange-500 mb-1">7</div>
            <div className="text-sm text-gray-500">วันติดต่อกัน</div>
          </Card>

          {/* Badges */}
          <Card className="p-5 border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">ของรางวัลของคุณ</h3>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`flex flex-col items-center p-3 rounded-xl text-center ${
                    b.done ? "bg-purple-50 border border-purple-100" : "bg-gray-50 border border-gray-100 opacity-50"
                  }`}
                >
                  <span className="text-2xl mb-1">{b.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{b.label}</span>
                  {b.done && (
                    <Badge className="mt-1 text-[10px] bg-purple-100 text-purple-700 border-purple-200 py-0">
                      ได้รับแล้ว
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-5 border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">ชุมชนของเรา</h3>
            <div className="space-y-2">
              {[
                { label: "สมาชิก", value: "12,450" },
                { label: "โพสต์วันนี้", value: "89" },
                { label: "คำถามที่ตอบ", value: "3,200+" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{s.label}</span>
                  <span className="font-bold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
