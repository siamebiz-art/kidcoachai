"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { ChevronLeft, Trash2, Download, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

/* ── Tabs ── */
type Tab = "draw" | "character";

/* ── Character creator data ── */
const CHAR_EMOJIS = ["🦸", "🧙", "🐉", "🦄", "🤖", "🦊", "🐼", "🦋", "🐸", "🌟", "🦁", "🐬"];
const TRAITS = ["กล้าหาญ", "ฉลาด", "ใจดี", "ขี้เล่น", "ซื่อสัตย์", "ตลก", "อบอุ่น", "เร็ว", "แข็งแกร่ง", "สร้างสรรค์"];
const POWERS = ["บินได้", "มองเห็นในที่มืด", "พูดภาษาสัตว์", "แข็งแกร่งมาก", "วาดรูปให้มีชีวิต", "เดินทางในเวลา", "รักษาบาดแผล", "ควบคุมไฟ", "ล่องหนได้", "อ่านใจคน"];
const COLORS_DRAW = ["#1a1a1a", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#ffffff"];

/* ════════════════════════════════════════════════════ */
export default function CreativityPage() {
  const { childProfile, childAge } = useProfile();
  const childName = childProfile?.name ?? "น้อง";
  const ageYears  = childAge ? parseInt(childAge) || 6 : 6;
  const [tab, setTab] = useState<Tab>("draw");

  /* ── Drawing state ── */
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const isDrawing   = useRef(false);
  const [color, setColor]         = useState("#1a1a1a");
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool]           = useState<"pen" | "eraser">("pen");

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => { if (tab === "draw") initCanvas(); }, [tab, initCanvas]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth   = tool === "eraser" ? brushSize * 4 : brushSize;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    isDrawing.current = false;
    canvasRef.current?.getContext("2d")?.beginPath();
  }

  function clearCanvas() {
    initCanvas();
    toast.success("ลบแล้ว!");
  }

  function downloadCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `kido-art-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("บันทึกรูปแล้ว! 🎨");
  }

  /* ── Character creator state ── */
  const [charEmoji,  setCharEmoji]  = useState("🦸");
  const [charName,   setCharName]   = useState("");
  const [charTrait1, setCharTrait1] = useState("");
  const [charTrait2, setCharTrait2] = useState("");
  const [charPower,  setCharPower]  = useState("");
  const [charBio,    setCharBio]    = useState("");
  const [bioLoading, setBioLoading] = useState(false);

  async function generateBio() {
    if (!charName.trim() || !charTrait1 || !charTrait2 || !charPower) {
      toast.error("กรอกข้อมูลให้ครบก่อนนะ!");
      return;
    }
    setBioLoading(true);
    setCharBio("");
    try {
      const res = await fetch("/api/kido-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "character",
          childName,
          ageYears,
          data: { name: charName, emoji: charEmoji, trait1: charTrait1, trait2: charTrait2, power: charPower },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const d = (await res.json()) as { bio: string };
      setCharBio(d.bio);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setBioLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      {/* Header */}
      <div className="p-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900">🎨 Kido Creativity Lab</h1>
            <p className="text-sm text-gray-500">สร้างสรรค์ผลงานของ{childName}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl mb-5">
          {(["draw", "character"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t ? "bg-white shadow-sm text-purple-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "draw" ? "🖌️ วาดรูป" : "🦸 สร้างตัวละคร"}
            </button>
          ))}
        </div>

        {/* ── Drawing Tab ── */}
        {tab === "draw" && (
          <div>
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-3 flex items-center gap-3 flex-wrap">
              {/* Colors */}
              <div className="flex gap-1.5 flex-wrap">
                {COLORS_DRAW.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setTool("pen"); }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${
                      color === c && tool === "pen" ? "border-purple-500 scale-110" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #e5e7eb" : undefined }}
                  />
                ))}
              </div>
              {/* Brush size */}
              <input
                type="range" min={2} max={24} value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-purple-500"
              />
              {/* Eraser */}
              <button
                onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors ${
                  tool === "eraser" ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"
                }`}
              >
                🧹 ยาง
              </button>
              {/* Actions */}
              <button onClick={clearCanvas} className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={downloadCanvas} className="p-2 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas */}
            <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-md overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={800}
                height={560}
                className="w-full cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
                style={{ touchAction: "none" }}
              />
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              🎨 วาดได้เลย! กดปุ่ม 💾 เพื่อบันทึกรูป
            </p>
          </div>
        )}

        {/* ── Character Creator Tab ── */}
        {tab === "character" && (
          <div className="space-y-4">
            {/* Emoji picker */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-3">เลือกรูปตัวละคร:</p>
              <div className="grid grid-cols-6 gap-2">
                {CHAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setCharEmoji(e)}
                    className={`text-3xl h-14 rounded-2xl border-2 transition-all ${
                      charEmoji === e ? "border-purple-400 bg-purple-50 scale-110" : "border-gray-100 hover:border-purple-200"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-2">ชื่อตัวละคร:</p>
              <input
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="ตั้งชื่อตัวละครของคุณ..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition-colors"
                maxLength={20}
              />
            </div>

            {/* Traits */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-3">นิสัย (เลือก 2 อย่าง):</p>
              <div className="flex flex-wrap gap-2">
                {TRAITS.map((t) => {
                  const selected = charTrait1 === t || charTrait2 === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        if (selected) {
                          if (charTrait1 === t) setCharTrait1("");
                          else setCharTrait2("");
                        } else if (!charTrait1) setCharTrait1(t);
                        else if (!charTrait2) setCharTrait2(t);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                        selected ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-100 text-gray-600 hover:border-purple-200"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Power */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-bold text-gray-700 mb-3">พลังพิเศษ:</p>
              <div className="flex flex-wrap gap-2">
                {POWERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCharPower(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                      charPower === p ? "border-pink-400 bg-pink-50 text-pink-700" : "border-gray-100 text-gray-600 hover:border-pink-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <button
              onClick={generateBio}
              disabled={bioLoading || !charName.trim() || !charTrait1 || !charTrait2 || !charPower}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {bioLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {bioLoading ? "Kido กำลังเขียนประวัติ..." : "สร้างตัวละคร!"}
            </button>

            {/* Character card */}
            {charBio && (
              <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-center">
                  <div className="text-6xl mb-2">{charEmoji}</div>
                  <p className="text-white font-black text-xl">{charName}</p>
                  <div className="flex justify-center gap-2 mt-2">
                    {[charTrait1, charTrait2].filter(Boolean).map((t) => (
                      <span key={t} className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    <span className="bg-yellow-400/80 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">⚡ {charPower}</span>
                  </div>
                </div>
                <div className="p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="flex items-start gap-3">
                    <img src="/kido-point.png" alt="Kido" className="w-9 h-9 object-contain shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed">{charBio}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
