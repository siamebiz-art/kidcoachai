"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useGameDifficulty } from "@/hooks/use-game-difficulty";
import { useGameExitTracker } from "@/hooks/use-game-exit-tracker";
import { playSound } from "@/lib/sounds";

// ── ข้อมูลภาพปริศนา ──────────────────────────────────────────────────────────
interface PuzzleDef { emoji: string; label: string; bg: string; accent: string }

const PUZZLES: PuzzleDef[] = [
  { emoji: "🐶", label: "น้องหมา",    bg: "#FFEAC5", accent: "#F59E0B" },
  { emoji: "🐱", label: "น้องแมว",    bg: "#EDE7F6", accent: "#7C3AED" },
  { emoji: "☀️", label: "ดวงอาทิตย์", bg: "#FFFDE7", accent: "#EAB308" },
  { emoji: "🌸", label: "ดอกไม้",     bg: "#FCE4EC", accent: "#EC4899" },
  { emoji: "🐟", label: "ปลา",        bg: "#E0F7FA", accent: "#0EA5E9" },
  { emoji: "⭐", label: "ดาว",        bg: "#FFF9E6", accent: "#F97316" },
  { emoji: "🦁", label: "สิงโต",      bg: "#FFF3E0", accent: "#EA580C" },
  { emoji: "🐘", label: "ช้าง",       bg: "#F3F4F6", accent: "#6B7280" },
  { emoji: "🦋", label: "ผีเสื้อ",    bg: "#F0FDF4", accent: "#16A34A" },
  { emoji: "🚗", label: "รถ",         bg: "#EFF6FF", accent: "#2563EB" },
];

type GridSize = 2 | 3 | 4;
type Phase    = "setup" | "game" | "done";

const BOARD_PIECE = 88; // px ต่อชิ้นบนกระดาน
const ROUNDS      = 3;  // จำนวนภาพต่อ session

// ── SVG ภายในของแต่ละภาพ ──────────────────────────────────────────────────────
function PuzzleContent({ p }: { p: PuzzleDef }) {
  return (
    <>
      <rect width="200" height="200" fill={p.bg}/>
      {/* emoji เต็มภาพ — ใหญ่สุด ไม่มีองค์ประกอบรอบข้าง */}
      <text x="100" y="158" textAnchor="middle" fontSize="172"
        fontFamily="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">
        {p.emoji}
      </text>
    </>
  );
}

// ── แสดงชิ้นส่วนจิ๊กซอ (clip viewport ไปส่วนที่ถูกต้อง) ─────────────────────
function PieceClip({ idx, gs, puzzle, size, style }: {
  idx: number; gs: number; puzzle: PuzzleDef; size: number; style?: React.CSSProperties;
}) {
  const row  = Math.floor(idx / gs);
  const col  = idx % gs;
  const full = size * gs;
  return (
    <div style={{ width: size, height: size, overflow: "hidden", position: "relative", ...style }}>
      <svg viewBox="0 0 200 200" width={full} height={full}
        style={{ position: "absolute", top: -(row * size), left: -(col * size), display: "block" }}>
        <PuzzleContent p={puzzle}/>
      </svg>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function speak(text: string, rate = 0.78, pitch = 1.15) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "th-TH"; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

function makeShuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Component หลัก ────────────────────────────────────────────────────────────
export default function JigsawPage() {
  const { childProfile, saveGameSession } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const {
    difficulty, diffLabel, recordResult,
    justPromoted, promotedToLabel, clearJustPromoted,
  } = useGameDifficulty("jigsaw");

  const [phase,       setPhase]      = useState<Phase>("setup");
  const { markRoundStarted } = useGameExitTracker("jigsaw", phase);

  const [gridSize,    setGridSize]   = useState<GridSize>(2);
  const [puzzleQ,     setPuzzleQ]    = useState<number[]>([]);
  const [puzzlePos,   setPuzzlePos]  = useState(0);
  const [board,       setBoard]      = useState<(number|null)[]>([]);
  const [tray,        setTray]       = useState<number[]>([]);
  const [selected,    setSelected]   = useState<number|null>(null);
  const [wrongSlot,   setWrongSlot]  = useState<number|null>(null);
  const [hintSlot,    setHintSlot]   = useState<number|null>(null);
  const [solvedCount, setSolvedCount]= useState(0);
  const wrongAtt = useRef<Map<number, number>>(new Map());

  // sync gridSize จาก difficulty hook
  useEffect(() => {
    setGridSize(difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4);
  }, [difficulty]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // บันทึก session เมื่อจบ
  useEffect(() => {
    if (phase !== "done") return;
    const accuracy = Math.round((solvedCount / ROUNDS) * 100);
    const { promoted } = recordResult(accuracy);
    if (promoted) playSound("levelUp");
    else playSound("celebrate");
    saveGameSession({
      gameId: "jigsaw", gameName: "ต่อจิ๊กซอ",
      date: new Date().toISOString().split("T")[0],
      score: solvedCount, total: ROUNDS, accuracy, ts: Date.now(),
    }).catch(console.error);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPuzzle = PUZZLES[puzzleQ[puzzlePos] ?? 0];
  const n             = gridSize * gridSize;
  const traySize      = gridSize <= 2 ? 78 : gridSize <= 3 ? 68 : 56;

  // ── เริ่มภาพใหม่ ────────────────────────────────────────────────────────────
  function initPuzzle(gs: GridSize, puz: PuzzleDef) {
    setBoard(Array(gs * gs).fill(null));
    setTray(makeShuffled(gs * gs));
    setSelected(null);
    setWrongSlot(null);
    setHintSlot(null);
    wrongAtt.current = new Map();
    speak(`มาต่อจิ๊กซอ${puz.label}กันเลย!`, 0.82, 1.2);
  }

  function startSession() {
    const q = makeShuffled(PUZZLES.length).slice(0, ROUNDS);
    setPuzzleQ(q);
    setPuzzlePos(0);
    setSolvedCount(0);
    setPhase("game");
    markRoundStarted();
    playSound("tap");
    initPuzzle(gridSize, PUZZLES[q[0]]);
  }

  // ── แตะชิ้นส่วนในถาด ────────────────────────────────────────────────────────
  function handlePieceTap(pieceIdx: number) {
    setSelected(prev => prev === pieceIdx ? null : pieceIdx);
    playSound("tap");
  }

  // ── แตะช่องบนกระดาน ─────────────────────────────────────────────────────────
  function handleSlotTap(slotIdx: number) {
    if (selected === null) return;
    if (board[slotIdx] !== null) { playSound("tap"); return; } // ช่องเต็มแล้ว

    if (slotIdx === selected) {
      // ✅ ถูกต้อง! — piece index === correct slot index
      const newBoard = [...board];
      newBoard[slotIdx] = selected;
      setBoard(newBoard);
      setTray(prev => prev.filter(p => p !== selected));
      setSelected(null);
      wrongAtt.current.delete(selected);
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(40);

      if (newBoard.every(s => s !== null)) {
        // ภาพนี้เสร็จแล้ว!
        const snapPos  = puzzlePos;
        const snapQ    = puzzleQ;
        const snapGs   = gridSize;
        const snapSolved = solvedCount + 1;
        setTimeout(() => {
          playSound("celebrate");
          if (navigator.vibrate) navigator.vibrate([40, 20, 40, 20, 60]);
          setSolvedCount(snapSolved);
          speak(`ต่อ${currentPuzzle.label}สมบูรณ์แล้ว เก่งมาก!`, 0.85, 1.2);
          if (snapPos + 1 >= ROUNDS) {
            setTimeout(() => setPhase("done"), 2200);
          } else {
            setTimeout(() => {
              const nextPos = snapPos + 1;
              setPuzzlePos(nextPos);
              initPuzzle(snapGs, PUZZLES[snapQ[nextPos]]);
            }, 2400);
          }
        }, 350);
      } else {
        if (Math.random() < 0.35) speak("ดีมาก!", 0.9, 1.3);
      }
    } else {
      // ❌ ผิดช่อง
      setWrongSlot(slotIdx);
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([40, 20, 40]);

      const cnt = (wrongAtt.current.get(selected) ?? 0) + 1;
      wrongAtt.current.set(selected, cnt);
      if (cnt >= 2 && hintSlot === null) {
        setHintSlot(selected); // correct slot = piece index
        speak("ลองดูช่องที่กะพริบนะ", 0.78, 1.1);
        setTimeout(() => setHintSlot(null), 2600);
      }
      setTimeout(() => setWrongSlot(null), 500);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard"
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-600"/>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🧩 ต่อจิ๊กซอ</h1>
            <p className="text-sm text-gray-500">แตะชิ้น · แตะช่อง · ต่อให้ครบ ✨</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-4 mb-5 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0"/>
          <div className="bg-green-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm leading-snug">
              สวัสดี{childName}! มาต่อจิ๊กซอกัน เล่น {ROUNDS} ภาพต่อรอบนะ 🎉
            </p>
            <p className="text-gray-400 text-xs mt-1">แตะชิ้นส่วน → แตะช่องที่ถูกต้อง</p>
          </div>
        </div>

        {/* ตัวอย่างภาพ */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3 text-center">ภาพที่จะต่อ</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {PUZZLES.slice(0, 5).map((p, i) => (
              <div key={i} className="rounded-xl overflow-hidden border-2 border-gray-100">
                <svg viewBox="0 0 200 200" width={54} height={54}>
                  <PuzzleContent p={p}/>
                </svg>
              </div>
            ))}
            <div className="w-[54px] h-[54px] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs font-bold">+{PUZZLES.length - 5}</span>
            </div>
          </div>
        </div>

        {/* ระดับ */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">ระดับความยาก</p>
          <div className="flex gap-2.5">
            {([2, 3, 4] as GridSize[]).map(g => {
              const sel = gridSize === g;
              const info: Record<number, { label: string; desc: string }> = {
                2: { label: "ง่าย",  desc: "4 ชิ้น"  },
                3: { label: "กลาง", desc: "9 ชิ้น"  },
                4: { label: "ยาก",  desc: "16 ชิ้น" },
              };
              return (
                <button key={g} onClick={() => { playSound("tap"); setGridSize(g); }}
                  className={`flex-1 rounded-2xl py-4 border-2 flex flex-col items-center gap-1 active:scale-[0.97] transition-all
                    ${sel ? "border-green-300 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                  {/* mini grid preview */}
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${g}, 8px)`, gap: 1.5 }}>
                    {Array.from({ length: g * g }).map((_, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 1.5 }}
                        className={sel ? "bg-green-400" : "bg-gray-300"}/>
                    ))}
                  </div>
                  <span className={`font-black text-sm mt-1 ${sel ? "text-green-700" : "text-gray-500"}`}>{info[g].label}</span>
                  <span className={`text-xs ${sel ? "text-green-500" : "text-gray-400"}`}>{info[g].desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={startSession}
          className="w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 active:scale-[0.98] transition-transform">
          🧩 เริ่มต่อจิ๊กซอเลย!
        </button>
      </div>
    </div>
  );

  // ── DONE ──────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = solvedCount / ROUNDS;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kido-celebrate.png" alt="Kido" className="w-32 h-32 object-contain mb-3 animate-bounce"/>
        {justPromoted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2 w-full max-w-xs">
            <span className="text-xl">🏆</span>
            <div className="text-left">
              <div className="text-sm font-black text-yellow-800">เลื่อนระดับแล้ว!</div>
              <div className="text-xs text-yellow-600">ระดับ &quot;{promotedToLabel}&quot;</div>
            </div>
            <button onClick={clearJustPromoted} className="ml-auto text-yellow-400 text-lg">×</button>
          </div>
        )}
        <h2 className="text-3xl font-black text-gray-900 mb-2">
          {pct >= 1 ? "ต่อครบทุกภาพ! 🎉" : pct >= 0.5 ? "ทำได้ดีมาก! 👏" : "ลองอีกทีนะ 💪"}
        </h2>
        <p className="text-sm text-gray-400 mb-1">ระดับ: {diffLabel}</p>
        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-5xl font-black text-green-600">{solvedCount}</span>
          <span className="text-xl text-gray-400">/ {ROUNDS} ภาพ</span>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => { setPhase("setup"); setSolvedCount(0); }}
            className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95">
            <RefreshCcw className="w-4 h-4"/> เล่นใหม่
          </button>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm active:scale-95">
              กลับหน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────────────────────
  if (!currentPuzzle) return null;
  const placedCount = board.filter(s => s !== null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col select-none">
      <style>{`
        @keyframes wrong-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-9px)} 40%{transform:translateX(9px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes piece-in    { 0%{transform:scale(.65) rotate(-6deg);opacity:0} 65%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes hint-glow   { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.6)} 50%{box-shadow:0 0 0 8px rgba(74,222,128,.0)} }
        @keyframes hint-pulse  { 0%,100%{border-color:rgba(74,222,128,.4)} 50%{border-color:rgba(74,222,128,1)} }
        .wrong-shake { animation: wrong-shake .45s ease }
        .piece-in    { animation: piece-in .35s cubic-bezier(.34,1.56,.64,1) both }
        .hint-glow   { animation: hint-glow .7s ease infinite, hint-pulse .7s ease infinite }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <button onClick={() => { window.speechSynthesis?.cancel(); setPhase("setup"); }}
          className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-90">
          <ChevronLeft className="w-5 h-5 text-gray-600"/>
        </button>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-600">{currentPuzzle.label}</p>
          <p className="text-xs text-gray-400">{placedCount}/{n} ชิ้น · ภาพ {puzzlePos + 1}/{ROUNDS}</p>
        </div>
        <button onClick={() => speak(`มาต่อจิ๊กซอ${currentPuzzle.label}กันเลย!`, 0.82, 1.2)}
          className="w-9 h-9 rounded-full bg-white border border-green-100 shadow-sm flex items-center justify-center active:scale-90">
          <span className="text-lg">🔊</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 mx-4 rounded-full overflow-hidden shrink-0">
        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${(placedCount / n) * 100}%` }}/>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-3">
        {/* Reference image */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">ตัวอย่าง →</span>
          <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
            <svg viewBox="0 0 200 200" width={gridSize * 24} height={gridSize * 24}>
              <PuzzleContent p={currentPuzzle}/>
            </svg>
          </div>
        </div>

        {/* Puzzle board */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, ${BOARD_PIECE}px)`, gap: 4 }}>
          {Array.from({ length: n }).map((_, slotIdx) => {
            const piece    = board[slotIdx];
            const isEmpty  = piece === null;
            const isWrong  = wrongSlot === slotIdx;
            const isHint   = hintSlot === slotIdx;
            const canDrop  = isEmpty && selected !== null;

            return (
              <button key={slotIdx} onClick={() => handleSlotTap(slotIdx)}
                disabled={!isEmpty || selected === null}
                style={{ width: BOARD_PIECE, height: BOARD_PIECE }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${isEmpty
                    ? canDrop
                      ? isHint
                        ? "border-green-400 bg-green-50 hint-glow"
                        : "border-dashed border-green-300 bg-green-50/40 active:scale-95 hover:border-green-400"
                      : "border-dashed border-gray-200 bg-gray-50"
                    : "border-green-300 shadow-sm"
                  }
                  ${isWrong ? "wrong-shake" : ""}`}
              >
                {isEmpty ? (
                  // Ghost faint image ในตำแหน่งที่ถูก
                  <PieceClip idx={slotIdx} gs={gridSize} puzzle={currentPuzzle} size={BOARD_PIECE}
                    style={{ opacity: 0.12 }}/>
                ) : (
                  <div className="piece-in">
                    <PieceClip idx={piece} gs={gridSize} puzzle={currentPuzzle} size={BOARD_PIECE}/>
                  </div>
                )}
                {isWrong && <div className="absolute inset-0 bg-red-200/50 rounded-xl pointer-events-none"/>}
                {isEmpty && isHint && <div className="absolute inset-0 bg-green-300/20 rounded-xl pointer-events-none"/>}
              </button>
            );
          })}
        </div>

        {/* Piece tray */}
        <div className="bg-white/90 rounded-2xl border border-gray-100 shadow-sm px-4 pt-3 pb-3 w-full max-w-sm">
          <p className="text-xs text-gray-400 text-center mb-2">
            {selected !== null ? "แตะช่องบนกระดาน" : "แตะชิ้นส่วนเพื่อเลือก"} 👆
          </p>
          {tray.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {tray.map(pieceIdx => {
                const isSel = selected === pieceIdx;
                return (
                  <button key={pieceIdx} onClick={() => handlePieceTap(pieceIdx)}
                    className={`rounded-xl overflow-hidden border-2 transition-all active:scale-90
                      ${isSel
                        ? "border-green-500 ring-2 ring-green-400 ring-offset-2 scale-105 shadow-md"
                        : "border-gray-200 hover:border-green-300 shadow-sm"}`}
                    style={{ width: traySize, height: traySize }}>
                    <PieceClip idx={pieceIdx} gs={gridSize} puzzle={currentPuzzle} size={traySize}/>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-green-600 font-bold text-sm py-1">🎉 ต่อครบแล้ว!</p>
          )}
        </div>
      </div>
    </div>
  );
}
