"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, RotateCcw, CheckCircle2, Trophy } from "lucide-react";
import { useKidoVoice } from "@/hooks/use-kido-voice";
import { KidoGameOverlay } from "@/components/kido/kido-game-overlay";
import type { GameResult } from "@/lib/types";

const VOCAB_CATEGORIES: Record<string, { emoji: string; word: string }[]> = {
  "🐾 สัตว์": [
    { emoji: "🐱", word: "แมว" },
    { emoji: "🐶", word: "หมา" },
    { emoji: "🐸", word: "กบ" },
    { emoji: "🐰", word: "กระต่าย" },
    { emoji: "🐻", word: "หมี" },
    { emoji: "🦁", word: "สิงโต" },
    { emoji: "🐮", word: "วัว" },
    { emoji: "🐷", word: "หมู" },
    { emoji: "🐟", word: "ปลา" },
    { emoji: "🐘", word: "ช้าง" },
  ],
  "🍎 ผลไม้": [
    { emoji: "🍎", word: "แอปเปิ้ล" },
    { emoji: "🍌", word: "กล้วย" },
    { emoji: "🍊", word: "ส้ม" },
    { emoji: "🍇", word: "องุ่น" },
    { emoji: "🍓", word: "สตรอว์เบอร์รี่" },
    { emoji: "🍉", word: "แตงโม" },
    { emoji: "🥭", word: "มะม่วง" },
    { emoji: "🍍", word: "สับปะรด" },
  ],
  "🏠 สิ่งของรอบตัว": [
    { emoji: "📚", word: "หนังสือ" },
    { emoji: "✏️", word: "ดินสอ" },
    { emoji: "🎒", word: "กระเป๋า" },
    { emoji: "🚗", word: "รถ" },
    { emoji: "🏠", word: "บ้าน" },
    { emoji: "☀️", word: "ดวงอาทิตย์" },
    { emoji: "🌙", word: "พระจันทร์" },
    { emoji: "⭐", word: "ดาว" },
  ],
};

export function FlashcardGame({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (result?: GameResult) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cards, setCards] = useState<{ emoji: string; word: string }[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const { emotion, message, speak } = useKidoVoice();
  const announcedDone = useRef(false);
  const learnedRef = useRef(0);

  useEffect(() => { speak("มาฝึกคำศัพท์กันเลย! เลือกหมวดที่ชอบนะ 📖"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Kido asks about each new card
  useEffect(() => {
    if (!selectedCat || done) return;
    speak("รู้จักรูปนี้ไหมนะ? ลองดูแล้วแตะการ์ดได้เลย!", "talking");
  }, [index, done, selectedCat]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done && !announcedDone.current) {
      announcedDone.current = true;
      speak("น้องจำคำศัพท์ได้เก่งมาก! เยี่ยมสุดๆ! 🏆", "celebrating");
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = (cat: string) => {
    setSelectedCat(cat);
    setCards([...VOCAB_CATEGORIES[cat]].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
    setDone(false);
    announcedDone.current = false;
    learnedRef.current = 0;
    // question effect will fire for first card
  };

  const next = (remember: boolean) => {
    const word = cards[index]?.word ?? "";
    if (remember) {
      learnedRef.current++;
      speak(`${word} จำได้แล้ว! เก่งมากเลย!`, "celebrating", () => {
        if (index + 1 >= cards.length) {
          setDone(true);
        } else {
          setIndex(index + 1);
          setFlipped(false);
        }
      });
    } else {
      speak(`${word} ลองฝึกอีกครั้งนะ จะจำได้เองเลย!`, "thinking");
      setCards((prev) => {
        const updated = [...prev];
        const [current] = updated.splice(index, 1);
        updated.push(current);
        return updated;
      });
      setFlipped(false);
    }
  };

  if (!selectedCat) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <KidoGameOverlay emotion={emotion} message={message} />
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">บัตรคำศัพท์</h1>
        <p className="text-gray-500 text-sm mb-6">แตะการ์ดเพื่อดูคำ แล้วบอกว่าจำได้หรือยัง</p>
        <div className="grid gap-3">
          {Object.entries(VOCAB_CATEGORIES).map(([cat, words]) => (
            <button
              key={cat}
              onClick={() => startGame(cat)}
              className="p-5 bg-white border-2 border-gray-100 rounded-2xl text-left hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-gray-900">{cat}</div>
                <div className="text-sm text-gray-400 mt-0.5">{words.length} คำ</div>
              </div>
              <span className="text-3xl">{cat.split(" ")[0]}</span>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เก่งมาก! 🎉</h2>
        <p className="text-gray-500 mb-6">ฝึกครบ {VOCAB_CATEGORIES[selectedCat].length} คำแล้ว</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => startGame(selectedCat)} className="flex-1 rounded-xl gap-2">
            <RotateCcw className="w-4 h-4" /> เล่นอีกครั้ง
          </Button>
          <Button
            onClick={() => onComplete({ score: learnedRef.current, total: VOCAB_CATEGORIES[selectedCat!].length })}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> บันทึกเสร็จแล้ว
          </Button>
        </div>
      </div>
    );
  }

  const card = cards[index];
  const progress = (index / cards.length) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <KidoGameOverlay emotion={emotion} message={message} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> กลับ
        </button>
        <span className="text-sm text-gray-500">{index + 1} / {cards.length}</span>
      </div>

      <Progress value={progress} className="mb-6 h-2" />

      {/* Flip card */}
      <div
        onClick={() => { if (!flipped) speak(`${card.word}`, "talking"); setFlipped(!flipped); }}
        className="w-full h-64 rounded-3xl cursor-pointer select-none mb-6"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.4s",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front — emoji */}
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex flex-col items-center justify-center gap-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-8xl">{card.emoji}</span>
            <p className="text-sm text-gray-400">แตะเพื่อดูคำ</p>
          </div>
          {/* Back — word */}
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center gap-3"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-7xl">{card.emoji}</span>
            <span className="text-5xl font-bold text-white">{card.word}</span>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => next(false)}
            className="rounded-2xl py-5 text-base border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            🔄 ยังจำไม่ได้
          </Button>
          <Button
            onClick={() => next(true)}
            className="rounded-2xl py-5 text-base bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
          >
            ✓ จำได้แล้ว
          </Button>
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm mt-2">แตะที่การ์ดเพื่อดูคำ</p>
      )}
    </div>
  );
}
