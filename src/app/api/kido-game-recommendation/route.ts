import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";
import type { GameSession } from "@/lib/types";

type GameId = "matching" | "picture-quiz" | "flashcard" | "counting" | "sorting";

const GAME_DESCRIPTIONS: Record<GameId, string> = {
  "flashcard":    "บัตรคำ — ฝึกจำคำศัพท์ ภาษา การอ่าน",
  "picture-quiz": "ชี้รูปภาพ — จดจำรูปกับคำ ฝึกภาษาและความเข้าใจ",
  "sorting":      "จัดหมวดหมู่ — ฝึกคิดแยกประเภท ตรรกะ",
  "counting":     "นับจำนวน — ฝึกคณิตศาสตร์เบื้องต้น สมาธิ",
  "matching":     "จับคู่ภาพ — ฝึกความจำระยะสั้น สมาธิ จดจำ pattern",
};

// rule-based fallback — no AI needed
function getRuleBasedOrder(diagnosisKey: string, ageMonths: number): GameId[] {
  if (ageMonths > 0 && ageMonths < 36) {
    return ["picture-quiz", "counting", "flashcard", "sorting", "matching"];
  }
  const key = diagnosisKey.toLowerCase();
  if (key.includes("speech") || key.includes("พูด") || key.includes("ภาษา")) {
    return ["flashcard", "picture-quiz", "sorting", "counting", "matching"];
  }
  if (key.includes("adhd") || key.includes("สมาธิ")) {
    return ["counting", "sorting", "matching", "picture-quiz", "flashcard"];
  }
  if (key.includes("autism") || key.includes("asd") || key.includes("ออทิ")) {
    return ["sorting", "matching", "counting", "flashcard", "picture-quiz"];
  }
  if (key.includes("global") || key.includes("พัฒนาการช้า")) {
    return ["picture-quiz", "counting", "flashcard", "sorting", "matching"];
  }
  return ["picture-quiz", "flashcard", "sorting", "counting", "matching"];
}

export async function POST(req: Request) {
  const guard = await aiGuard("kido-recommendation");
  if (!guard.ok) {
    // On rate-limit → return rule-based fallback (don't block the UI)
    const body = await req.json().catch(() => ({})) as {
      diagnosisKey?: string; ageMonths?: number;
    };
    const order = getRuleBasedOrder(body.diagnosisKey ?? "", body.ageMonths ?? 0);
    return Response.json({ order, highlight: order[0], reason: "", source: "fallback" });
  }

  const { childName, childAge, diagnosisLabel, diagnosisKey, ageMonths, recentSessions } =
    (await req.json()) as {
      childName?: string;
      childAge?: string;
      diagnosisLabel?: string;
      diagnosisKey?: string;
      ageMonths?: number;
      recentSessions?: GameSession[];
    };

  // If no profile at all → return rule-based silently
  if (!diagnosisKey && !diagnosisLabel && (!recentSessions || recentSessions.length === 0)) {
    const order = getRuleBasedOrder("", ageMonths ?? 0);
    return Response.json({ order, highlight: order[0], reason: "", source: "fallback" });
  }

  const sessionSummary = recentSessions && recentSessions.length > 0
    ? recentSessions.map((s) => `- ${s.gameName}: ${s.score}/${s.total} (${s.accuracy}%) วันที่ ${s.date}`).join("\n")
    : "ยังไม่มีประวัติการเล่น";

  const prompt = `คุณคือ KidCoach AI วิเคราะห์ข้อมูลเด็กแล้วแนะนำลำดับเกมที่เหมาะสมที่สุด

ข้อมูลเด็ก:
- ชื่อ: ${childName ?? "ไม่ระบุ"}
- อายุ: ${childAge ?? "ไม่ระบุ"}
- ความต้องการพิเศษ: ${diagnosisLabel ?? "ไม่ระบุ"}

ผลการเล่นเกมล่าสุด:
${sessionSummary}

เกมที่มี:
${(Object.entries(GAME_DESCRIPTIONS) as [GameId, string][]).map(([id, desc]) => `- "${id}": ${desc}`).join("\n")}

เรียงลำดับ 5 เกมจากเหมาะสมที่สุดไปน้อยสุด โดยพิจารณา:
1. ความต้องการพิเศษของเด็ก (ฝึกด้านที่อ่อนแอก่อน)
2. คะแนนที่ต่ำในประวัติ (ต้องฝึกซ้ำ)
3. ความหลากหลาย (ไม่ซ้ำเกมเดิมทุกวัน)

ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น:
{
  "order": ["game-id-1","game-id-2","game-id-3","game-id-4","game-id-5"],
  "highlight": "game-id-1",
  "reason": "ประโยคสั้นๆ บอก kido ว่าทำไมแนะนำเกมนี้ก่อน (ภาษาไทย ≤15 คำ)"
}`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 200,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON");

    const data = JSON.parse(jsonMatch[0]) as {
      order: GameId[];
      highlight: GameId;
      reason: string;
    };

    // validate all game IDs are valid
    const validIds = new Set(Object.keys(GAME_DESCRIPTIONS) as GameId[]);
    const safeOrder = data.order.filter((id) => validIds.has(id));
    // ensure all 5 games present (fill missing with rule-based)
    const fallback = getRuleBasedOrder(diagnosisKey ?? "", ageMonths ?? 0);
    const finalOrder = [
      ...safeOrder,
      ...fallback.filter((id) => !safeOrder.includes(id)),
    ].slice(0, 5) as GameId[];

    return Response.json({
      order: finalOrder,
      highlight: validIds.has(data.highlight) ? data.highlight : finalOrder[0],
      reason: data.reason ?? "",
      source: "ai",
    });
  } catch (err) {
    console.error("kido-recommendation error:", err);
    const order = getRuleBasedOrder(diagnosisKey ?? "", ageMonths ?? 0);
    return Response.json({ order, highlight: order[0], reason: "", source: "fallback" });
  }
}
