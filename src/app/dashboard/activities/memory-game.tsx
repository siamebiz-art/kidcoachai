"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, RotateCcw, CheckCircle2 } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const EMOJI_SETS = {
  easy: ["🐱", "🐶", "🐸", "🐰", "🦁", "🐮"],
  hard: ["🐱", "🐶", "🐸", "🐰", "🦁", "🐮", "🍎", "🍌"],
};

type Difficulty = "easy" | "hard";
type Card = { id: number; emoji: string; isFlipped: boolean; isMatched: boolean };

function createCards(emojis: string[]): Card[] {
  return [...emojis, ...emojis]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false }));
}

export function MemoryMatchGame({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (result?: GameResult) => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const { emotion, message, speak, praise, encourage } = useKidoVoice();
  const announcedDone = useRef(false);

  useEffect(() => { speak("มาเล่นจับคู่ภาพกันเลย! เลือกระดับที่ชอบนะ 🃏"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("เก่งมากเลย! จับคู่ได้ครบทุกคู่! 🏆", "celebrating");
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setCards(createCards(EMOJI_SETS[diff]));
    setSelected([]);
    setMoves(0);
    setLocked(false);
    setDone(false);
    announcedDone.current = false;
    speak("เริ่มเลย! พลิกการ์ดหาคู่ที่เหมือนกันนะ 🔍");
  };

  const handleFlip = useCallback((id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    const newSelected = [...selected, id];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newSelected.map((sid) => newCards.find((c) => c.id === sid)!);
      if (a.emoji === b.emoji) {
        const matched = newCards.map((c) =>
          c.id === a.id || c.id === b.id ? { ...c, isMatched: true } : c
        );
        setCards(matched);
        setSelected([]);
        setLocked(false);
        const allDone = matched.every((c) => c.isMatched);
        praise(allDone ? () => setDone(true) : undefined);
      } else {
        encourage();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a.id || c.id === b.id ? { ...c, isFlipped: false } : c
            )
          );
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [cards, selected, locked, praise, encourage]);

  if (!difficulty) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <KidoGameOverlay emotion={emotion} message={message} />
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">เกมจับคู่ภาพ</h1>
        <p className="text-gray-500 text-sm mb-6">พลิกการ์ดเพื่อหาคู่ที่เหมือนกัน</p>
        <div className="grid gap-3">
          {(["easy", "hard"] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => startGame(diff)}
              className={`p-5 bg-white border-2 border-gray-100 rounded-2xl text-left transition-all flex items-center gap-4 ${
                diff === "easy"
                  ? "hover:border-green-300 hover:bg-green-50"
                  : "hover:border-purple-300 hover:bg-purple-50"
              }`}
            >
              <span className="text-3xl">{diff === "easy" ? "🐣" : "🦁"}</span>
              <div>
                <div className="font-semibold text-gray-900">
                  {diff === "easy" ? "ง่าย — 6 คู่ (12 ใบ)" : "ยาก — 8 คู่ (16 ใบ)"}
                </div>
                <div className="text-sm text-gray-400 mt-0.5">
                  {diff === "easy" ? "เหมาะสำหรับเด็กเล็ก" : "ท้าทายกว่า ฝึกสมาธิ"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <KidoGameOverlay emotion={emotion} message={message} />
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เก่งมากเลย! 🎉</h2>
        <p className="text-gray-500 mb-1">จับคู่ครบทุกคู่แล้ว</p>
        <p className="text-purple-600 font-bold text-xl mb-6">{moves} ครั้ง</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => startGame(difficulty)} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button
            onClick={() => { onComplete({ score: EMOJI_SETS[difficulty!].length, total: moves }); onBack(); }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> บันทึกเสร็จแล้ว
          </Button>
        </div>
      </div>
    );
  }

  const totalPairs = EMOJI_SETS[difficulty].length;
  const matchedCount = cards.filter((c) => c.isMatched).length / 2;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="text-sm font-medium text-gray-600">
          {matchedCount}/{totalPairs} คู่ · {moves} ครั้ง
        </div>
        <button
          onClick={() => startGame(difficulty)}
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> ใหม่
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className="aspect-square cursor-pointer"
            style={{ perspective: "600px" }}
          >
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: "preserve-3d",
                transition: "transform 0.35s ease",
                transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Hidden face */}
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-xl">❓</span>
              </div>
              {/* Emoji face */}
              <div
                className={`absolute inset-0 rounded-2xl flex items-center justify-center shadow-sm ${
                  card.isMatched
                    ? "bg-green-100 border-2 border-green-400"
                    : "bg-white border-2 border-purple-200"
                }`}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="text-2xl sm:text-3xl">{card.emoji}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
