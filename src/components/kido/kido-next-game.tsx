"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KidoGameOverlay } from "./kido-game-overlay";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import type { GameResult, GameSession, ChildProfile, AssessmentResult } from "@/lib/types";

const GAME_INFO: Record<string, { title: string; emoji: string; color: string }> = {
  "picture-quiz": { title: "เกมชี้รูปภาพ",   emoji: "👆", color: "from-orange-400 to-amber-500"  },
  "flashcard":    { title: "บัตรคำศัพท์",     emoji: "🃏", color: "from-blue-400 to-cyan-500"     },
  "memory":       { title: "เกมจับคู่ภาพ",    emoji: "🧩", color: "from-purple-400 to-violet-500" },
  "counting":     { title: "เกมนับจำนวน",     emoji: "🔢", color: "from-red-400 to-rose-500"      },
  "sorting":      { title: "เกมจัดหมวดหมู่",  emoji: "🗂️", color: "from-teal-400 to-green-500"   },
  "emotion":      { title: "เกมรู้จักอารมณ์", emoji: "🫀", color: "from-pink-400 to-rose-500"     },
  "shapes":       { title: "เกมรูปทรงและสี",  emoji: "🔴", color: "from-blue-400 to-indigo-500"   },
  "sequence":     { title: "เกมเรียงลำดับ",   emoji: "📋", color: "from-teal-400 to-cyan-500"     },
  "bubble-pop":    { title: "เกมป๊อปบับเบิล",     emoji: "🫧", color: "from-yellow-400 to-orange-400"  },
  "opposite":      { title: "เกมคำตรงข้าม",       emoji: "🔄", color: "from-indigo-400 to-purple-500"  },
  "dialogue":      { title: "เกมบทสนทนา",          emoji: "💬", color: "from-sky-400 to-blue-500"       },
  "needs":         { title: "เกมบอกความต้องการ",    emoji: "🙋", color: "from-emerald-400 to-teal-500"   },
  "odd-one-out":   { title: "เกมหาตัวแปลก",         emoji: "🔍", color: "from-amber-400 to-orange-500"   },
  "rhythm":        { title: "เกมจับจังหวะสี",       emoji: "🥁", color: "from-violet-400 to-purple-500"  },
  "word-category": { title: "เกมเลือกหมวดคำ",       emoji: "🏷️", color: "from-lime-400 to-green-500"    },
};

interface Props {
  result: GameResult;
  currentGameId: string;
  currentGameName: string;
  childProfile?: ChildProfile;
  latestAssessment?: AssessmentResult;
  gameSessions: GameSession[];
  onStartGame: (gameId: string) => void;
  onBack: () => void;
}

export function KidoNextGame({
  result, currentGameId, currentGameName,
  childProfile, latestAssessment, gameSessions,
  onStartGame, onBack,
}: Props) {
  const { emotion, message, speak } = useKidoVoice();
  const [nextGameId, setNextGameId] = useState<string | null>(null);
  const [reason, setReason]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [countdown, setCountdown]   = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef   = useRef(false);

  const accuracy = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  useEffect(() => {
    async function fetchNext() {
      try {
        const ageMonths = childProfile?.birthdate
          ? Math.floor((Date.now() - new Date(childProfile.birthdate).getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 0;

        const recentSessions = [
          ...gameSessions.slice(-10),
          {
            gameId: currentGameId,
            gameName: currentGameName,
            date: new Date().toISOString().slice(0, 10),
            score: result.score,
            total: result.total,
            accuracy,
            ts: Date.now(),
          },
        ];

        // Mastery check: < 60% → repeat same skill, ≥ 60% → advance
        const SKILL_GROUPS: Record<string, string[]> = {
          "ภาษา":        ["flashcard", "picture-quiz", "opposite", "word-category"],
          "การสื่อสาร":  ["emotion", "dialogue", "needs"],
          "การเรียนรู้": ["sorting", "shapes", "sequence", "memory"],
          "สมาธิ":       ["bubble-pop", "counting", "odd-one-out"],
          "กล้ามเนื้อ":  ["rhythm"],
        };
        const currentSkill = Object.entries(SKILL_GROUPS).find(([, ids]) => ids.includes(currentGameId))?.[0];
        const sameSkillGames = currentSkill ? SKILL_GROUPS[currentSkill].filter((id) => id !== currentGameId) : [];

        if (accuracy < 60 && sameSkillGames.length > 0) {
          // ยังไม่ผ่าน — วนเกมทักษะเดียวกัน
          const repeatGame = sameSkillGames[0] ?? currentGameId;
          setNextGameId(repeatGame);
          const repeatReason = `น้องยังฝึก${currentSkill}ได้อีกนะ ลองอีกครั้งเพื่อให้แข็งแกร่งขึ้น!`;
          setReason(repeatReason);
          speak(`ไม่เป็นไร ค่อยๆ ฝึกนะ! ${repeatReason}`, "thinking");
          return;
        }

        const res = await fetch("/api/kido-game-recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childName:      childProfile?.name,
            childAge:       childProfile?.birthdate,
            diagnosisLabel: childProfile?.diagnosisLabel,
            diagnosisKey:   childProfile?.diagnosisKey,
            ageMonths,
            recentSessions,
            currentAccuracy: accuracy,
          }),
        });

        const data = await res.json() as { order: string[]; highlight: string; reason: string };
        const next = data.order.find((id) => id !== currentGameId) ?? data.order[0];
        setNextGameId(next);
        setReason(data.reason);

        const info = GAME_INFO[next];
        const praise = accuracy >= 80 ? "เก่งมากเลย! " : "ดีมากนะ! ";
        speak(
          `${praise}${data.reason || `ต่อไปมาลอง${info?.title ?? next}กันนะ`}`,
          accuracy >= 80 ? "celebrating" : "talking",
        );
      } catch {
        const fallback = Object.keys(GAME_INFO).find((id) => id !== currentGameId) ?? "flashcard";
        setNextGameId(fallback);
        speak("เก่งมากเลย! มาลองเกมใหม่กันนะ!", "celebrating");
      } finally {
        setLoading(false);
      }
    }
    fetchNext();
  }, []); // eslint-disable-line

  // start countdown after loading done
  useEffect(() => {
    if (loading || !nextGameId) return;
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          if (!startedRef.current) { startedRef.current = true; onStartGame(nextGameId); }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current!);
  }, [loading, nextGameId]); // eslint-disable-line

  function handleStart() {
    if (!nextGameId) return;
    clearInterval(countdownRef.current!);
    startedRef.current = true;
    onStartGame(nextGameId);
  }

  function handleBack() {
    clearInterval(countdownRef.current!);
    startedRef.current = true;
    onBack();
  }

  const nextInfo = nextGameId ? GAME_INFO[nextGameId] : null;

  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <KidoGameOverlay emotion={emotion} message={message} />

      {/* Score summary */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm mb-1">{currentGameName}</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-black text-purple-600">{result.score}/{result.total}</span>
          <span className={`text-2xl font-bold ${accuracy >= 80 ? "text-green-500" : accuracy >= 50 ? "text-amber-500" : "text-red-400"}`}>
            {accuracy}%
          </span>
        </div>
        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xl ${i < Math.round(accuracy / 20) ? "opacity-100" : "opacity-20"}`}>⭐</span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-gray-400 text-sm">คิโด้กำลังวิเคราะห์...</p>
        </div>
      ) : nextInfo && (
        <div className="space-y-4">
          {reason && <p className="text-sm text-gray-500 leading-relaxed">{reason}</p>}

          {/* Next game card */}
          <div className={`rounded-3xl bg-gradient-to-br ${nextInfo.color} p-6 text-white shadow-lg`}>
            <p className="text-sm opacity-80 mb-1">เกมถัดไป</p>
            <div className="text-5xl mb-2">{nextInfo.emoji}</div>
            <p className="text-xl font-bold">{nextInfo.title}</p>
          </div>

          <Button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl py-4 text-base font-bold gap-2"
          >
            เล่นเลย! {countdown > 0 && <span className="bg-white/20 rounded-full w-6 h-6 text-sm flex items-center justify-center">{countdown}</span>}
          </Button>

          <button onClick={handleBack} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
            ดูเกมทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
