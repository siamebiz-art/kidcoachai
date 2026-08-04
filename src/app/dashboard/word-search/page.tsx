"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, RefreshCcw, Lightbulb, Trophy } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "animals", emoji: "🐾", label: "สัตว์",       color: "from-green-400 to-emerald-500",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  { id: "food",    emoji: "🍎", label: "อาหาร",       color: "from-orange-400 to-amber-500",   bg: "bg-amber-50",    border: "border-amber-200"   },
  { id: "space",   emoji: "🚀", label: "อวกาศ",       color: "from-indigo-400 to-purple-500",  bg: "bg-indigo-50",   border: "border-indigo-200"  },
  { id: "school",  emoji: "📚", label: "โรงเรียน",    color: "from-blue-400 to-cyan-500",      bg: "bg-blue-50",     border: "border-blue-200"    },
  { id: "family",  emoji: "👨‍👩‍👧", label: "ครอบครัว",  color: "from-pink-400 to-rose-500",      bg: "bg-pink-50",     border: "border-pink-200"    },
  { id: "sports",  emoji: "⚽", label: "กีฬา",        color: "from-yellow-400 to-lime-500",    bg: "bg-yellow-50",   border: "border-yellow-200"  },
  { id: "colors",  emoji: "🎨", label: "สี",          color: "from-fuchsia-400 to-pink-500",   bg: "bg-fuchsia-50",  border: "border-fuchsia-200" },
  { id: "nature",  emoji: "🌿", label: "ธรรมชาติ",   color: "from-teal-400 to-green-500",     bg: "bg-teal-50",     border: "border-teal-200"    },
];

type Level = "easy" | "medium" | "hard";
type Phase = "setup" | "game" | "done";
interface Cell { row: number; col: number }
interface PlacedWord { word: string; hint: string; cells: Cell[]; found: boolean; color?: string }

const LEVEL_CFG = {
  easy:   { label: "ง่าย",    size: 8,  wordCount: 6,  dirs: [[0,1],[1,0]]                     },
  medium: { label: "ปานกลาง", size: 10, wordCount: 8,  dirs: [[0,1],[1,0],[1,1],[-1,1]]        },
  hard:   { label: "ยาก",    size: 12, wordCount: 10, dirs: [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0]] },
};

const FOUND_COLORS = ["#10B981","#3B82F6","#8B5CF6","#F97316","#EC4899","#06B6D4","#F59E0B","#84CC16","#6366F1","#EF4444"];

// ── Grid builder ──────────────────────────────────────────────────────────────

function buildGrid(words: string[], size: number, dirs: number[][]): { grid: string[][], placements: { word: string; cells: Cell[] }[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placements: { word: string; cells: Cell[] }[] = [];

  for (const word of words) {
    let placed = false;
    for (let a = 0; a < 300 && !placed; a++) {
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const er = row + dr * (word.length - 1);
      const ec = col + dc * (word.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      const cells: Cell[] = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { ok = false; break; }
        cells.push({ row: r, col: c });
      }
      if (!ok) continue;
      cells.forEach((cell, i) => { grid[cell.row][cell.col] = word[i]; });
      placements.push({ word, cells });
      placed = true;
    }
  }

  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === "") grid[r][c] = A[Math.floor(Math.random() * 26)];

  return { grid, placements };
}

function getLineCells(start: Cell, end: Cell): Cell[] | null {
  const dr = end.row - start.row, dc = end.col - start.col;
  if (dr === 0 && dc === 0) return [start];
  if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = dr === 0 ? 0 : dr / Math.abs(dr);
  const sc = dc === 0 ? 0 : dc / Math.abs(dc);
  return Array.from({ length: len + 1 }, (_, i) => ({ row: start.row + sr * i, col: start.col + sc * i }));
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function WordSearchPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const ageYears  = childAge ? parseInt(childAge) || 7 : 7;

  const [phase,    setPhase]    = useState<Phase>("setup");
  const [category, setCategory] = useState("animals");
  const [level,    setLevel]    = useState<Level>("easy");
  const [loading,  setLoading]  = useState(false);
  const [grid,     setGrid]     = useState<string[][]>([]);
  const [words,    setWords]    = useState<PlacedWord[]>([]);
  const [selStart, setSelStart] = useState<Cell | null>(null);
  const [selEnd,   setSelEnd]   = useState<Cell | null>(null);
  const [hintCell, setHintCell] = useState<Cell | null>(null);

  const gridRef      = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Cell | null>(null);
  const dragEndRef   = useRef<Cell | null>(null);
  const isDragging   = useRef(false);
  const gridDataRef  = useRef<string[][]>([]);
  const wordsRef     = useRef<PlacedWord[]>([]);

  useEffect(() => { gridDataRef.current = grid; }, [grid]);
  useEffect(() => { wordsRef.current = words; }, [words]);

  const levelCfg = LEVEL_CFG[level];
  const activeCat = CATEGORIES.find(c => c.id === category) ?? CATEGORIES[0];

  // Selection highlight set
  const selCells = selStart && selEnd ? (getLineCells(selStart, selEnd) ?? []) : [];
  const selSet   = new Set(selCells.map(c => `${c.row},${c.col}`));

  // Found cell → color map
  const foundMap = new Map<string, string>();
  for (const w of words)
    if (w.found && w.color)
      for (const c of w.cells) foundMap.set(`${c.row},${c.col}`, w.color);

  // ── Touch coordinate → cell ──────────────────────────────────────────────
  const getCellFromCoords = useCallback((clientX: number, clientY: number): Cell | null => {
    const el = gridRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    const cellW = rect.width / levelCfg.size, cellH = rect.height / levelCfg.size;
    const col = Math.floor(x / cellW), row = Math.floor(y / cellH);
    if (row < 0 || row >= levelCfg.size || col < 0 || col >= levelCfg.size) return null;
    return { row, col };
  }, [levelCfg.size]);

  // ── Submit selection ─────────────────────────────────────────────────────
  const submitSelection = useCallback(() => {
    const start = dragStartRef.current, end = dragEndRef.current;
    if (!start || !end) return;
    const line = getLineCells(start, end);
    if (!line || line.length < 2) return;

    const selected    = line.map(c => gridDataRef.current[c.row]?.[c.col] ?? "").join("");
    const selectedRev = [...selected].reverse().join("");

    setWords(prev => {
      let hit = false;
      const next = prev.map((w, i) => {
        if (w.found) return w;
        if (w.word === selected || w.word === selectedRev) {
          hit = true;
          return { ...w, found: true, color: FOUND_COLORS[i % FOUND_COLORS.length] };
        }
        return w;
      });
      if (hit) {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(60);
        if (next.every(w => w.found)) setTimeout(() => setPhase("done"), 700);
      }
      return next;
    });
  }, []);

  // ── Pointer events (works on both mobile touch and desktop mouse) ────────
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const cell = getCellFromCoords(e.clientX, e.clientY);
    if (!cell) return;
    isDragging.current   = true;
    dragStartRef.current = cell;
    dragEndRef.current   = cell;
    setSelStart(cell);
    setSelEnd(cell);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const cell = getCellFromCoords(e.clientX, e.clientY);
    if (!cell) return;
    dragEndRef.current = cell;
    setSelEnd(cell);
  }
  function onPointerUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    submitSelection();
    dragStartRef.current = null;
    dragEndRef.current   = null;
    setSelStart(null);
    setSelEnd(null);
  }
  function onPointerCancel() {
    isDragging.current   = false;
    dragStartRef.current = null;
    dragEndRef.current   = null;
    setSelStart(null);
    setSelEnd(null);
  }

  // ── Start game ───────────────────────────────────────────────────────────
  async function startGame() {
    setLoading(true);
    try {
      const res = await fetch("/api/kido-wordsearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, level, childAge: ageYears }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        toast.error(d.error ?? "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }
      const { words: wordData } = await res.json() as { words: { word: string; hint: string }[] };
      const { grid: newGrid, placements } = buildGrid(
        wordData.map(w => w.word),
        levelCfg.size,
        levelCfg.dirs,
      );
      const placed: PlacedWord[] = placements.map(p => ({
        ...p,
        hint:  wordData.find(w => w.word === p.word)?.hint ?? "",
        found: false,
      }));
      setGrid(newGrid);
      setWords(placed);
      setPhase("game");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  function resetGame() {
    setPhase("setup");
    setGrid([]);
    setWords([]);
    setHintCell(null);
  }

  function showHint() {
    const unfound = words.find(w => !w.found);
    if (!unfound) return;
    const cell = unfound.cells[0];
    setHintCell(cell);
    setTimeout(() => setHintCell(null), 2500);
    toast("Kido ชี้ตัวอักษรแรกให้แล้ว 🔦", { icon: "💡", duration: 2000 });
  }

  // ── Cell style ───────────────────────────────────────────────────────────
  function cellStyle(r: number, c: number): React.CSSProperties {
    const key = `${r},${c}`;
    const foundColor = foundMap.get(key);
    if (foundColor)         return { background: foundColor, color: "#fff", fontWeight: 900 };
    if (hintCell?.row === r && hintCell?.col === c)
                            return { background: "#FCD34D", color: "#92400E", fontWeight: 900 };
    if (selSet.has(key))   return { background: "#3B82F6", color: "#fff", fontWeight: 900 };
    return {};
  }

  const foundCount = words.filter(w => w.found).length;

  // ── SETUP ────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-md mx-auto">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <Link href="/dashboard" className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🔍 Kido Word Search</h1>
            <p className="text-sm text-gray-500">หาคำศัพท์ภาษาอังกฤษสนุกๆ ✨</p>
          </div>
        </div>

        {/* Kido intro */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-4 mb-6 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-12 h-12 object-contain shrink-0" />
          <div className="bg-purple-50 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
            <p className="text-gray-800 font-semibold text-sm">สวัสดี{childName}! 🔍 ลองหาคำศัพท์ที่ซ่อนอยู่ในตารางดูนะ</p>
            <p className="text-gray-400 text-xs mt-1">เลือกหมวดและระดับ แล้วลุยเลย! 🎯</p>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-sm font-black text-gray-700 mb-3">เลือกหมวดคำศัพท์</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-2xl p-2.5 flex flex-col items-center gap-1 border-2 transition-all active:scale-95 ${
                  category === cat.id
                    ? `${cat.bg} ${cat.border} shadow-sm scale-[1.03]`
                    : "bg-gray-50 border-transparent hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[9px] font-bold text-gray-600 leading-tight text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-black text-gray-700 mb-3">ระดับความยาก</p>
          <div className="grid grid-cols-3 gap-2">
            {(["easy","medium","hard"] as Level[]).map(lv => {
              const cfg = LEVEL_CFG[lv];
              const colors = { easy: "border-green-300 bg-green-50 text-green-700", medium: "border-yellow-300 bg-yellow-50 text-yellow-700", hard: "border-red-300 bg-red-50 text-red-700" };
              return (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={`rounded-2xl p-3 border-2 transition-all active:scale-95 text-center ${
                    level === lv ? colors[lv] + " shadow-sm scale-[1.03]" : "border-gray-100 bg-gray-50 text-gray-500"
                  }`}
                >
                  <div className="font-black text-sm">{cfg.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{cfg.size}×{cfg.size} • {cfg.wordCount} คำ</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={loading}
          className={`w-full py-4 rounded-3xl font-black text-lg text-white shadow-lg transition-all bg-gradient-to-r ${activeCat.color} active:scale-[0.98] ${loading ? "opacity-70" : ""}`}
        >
          {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> กำลังสร้างปริศนา...</span> : "🔍 เริ่มเลย!"}
        </button>
      </div>
    </div>
  );

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (phase === "done") return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 flex flex-col items-center justify-center p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/kido-celebrate.png" alt="Kido" className="w-32 h-32 object-contain mb-3 animate-bounce" />
      <h2 className="text-3xl font-black text-gray-900 mb-1">เก่งมากเลย! 🎉</h2>
      <p className="text-gray-500 mb-1">หาครบทุกคำแล้ว</p>
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: words.length }).map((_, i) => (
          <span key={i} className="text-xl">⭐</span>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 w-full max-w-xs mb-6">
        <div className="text-sm font-bold text-gray-500 mb-3">คำที่หาเจอทั้งหมด</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {words.map(w => (
            <span key={w.word} className="px-3 py-1 rounded-full text-white text-xs font-black" style={{ background: w.color ?? "#6366F1" }}>
              {w.word} ({w.hint})
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={resetGame} className="flex-1 py-3.5 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center gap-2">
          <RefreshCcw className="w-4 h-4" /> เล่นใหม่
        </button>
        <Link href="/dashboard" className="flex-1">
          <button className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm">กลับหน้าหลัก</button>
        </Link>
      </div>
    </div>
  );

  // ── GAME ────────────────────────────────────────────────────────────────────
  const gridSizePx = Math.min(360, typeof window !== "undefined" ? window.innerWidth - 40 : 340);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={resetGame} className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center active:scale-95 transition-transform">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <div className="font-black text-sm text-gray-800">{activeCat.emoji} {activeCat.label} · {LEVEL_CFG[level].label}</div>
          <div className="text-xs text-gray-400">หาคำ {foundCount}/{words.length}</div>
        </div>
        <button onClick={showHint} className="w-9 h-9 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center active:scale-95 transition-transform" title="ขอ hint">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
        </button>
      </div>

      {/* Word chips */}
      <div className="px-4 mb-2 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {words.map(w => (
            <span
              key={w.word}
              className="px-2.5 py-1 rounded-full text-xs font-black transition-all"
              style={w.found
                ? { background: w.color, color: "#fff", textDecoration: "none" }
                : { background: "#f3f4f6", color: "#374151" }}
            >
              {w.found ? "✓ " : ""}{w.word}
              <span className="font-normal opacity-60 ml-0.5">({w.hint})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <div
          ref={gridRef}
          className="select-none rounded-2xl overflow-hidden border-2 border-purple-100 shadow-lg bg-white"
          style={{
            width: gridSizePx,
            height: gridSizePx,
            display: "grid",
            gridTemplateColumns: `repeat(${levelCfg.size}, 1fr)`,
            userSelect: "none",
            touchAction: "none",
            cursor: "crosshair",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const s = cellStyle(r, c);
              const isHint = hintCell?.row === r && hintCell?.col === c;
              return (
                <div
                  key={`${r},${c}`}
                  className={`flex items-center justify-center text-xs sm:text-sm font-black border border-gray-100 transition-colors duration-75 ${isHint ? "animate-pulse" : ""}`}
                  style={{
                    background:  s.background ?? "transparent",
                    color:       s.color ?? "#1f2937",
                    fontWeight:  s.fontWeight ?? 600,
                    fontSize: `${Math.max(9, Math.floor(gridSizePx / levelCfg.size * 0.42))}px`,
                  }}
                >
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kido-point.png" alt="Kido" className="w-8 h-8 object-contain" />
            <span className="text-xs text-gray-500 font-medium">
              {foundCount === 0
                ? <span className="animate-pulse font-bold text-purple-600">👆 ลากนิ้วเลือกตัวอักษร</span>
                : foundCount === words.length ? "เก่งมากเลย! 🎉"
                : `หาได้ ${foundCount} คำแล้ว 🔥`}
            </span>
          </div>
          <div className="flex gap-1">
            {words.map((w, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors`} style={{ background: w.found ? (w.color ?? "#10B981") : "#e5e7eb" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
