import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";
import type { GameSession } from "@/lib/types";

type GameId =
  | "matching" | "picture-quiz" | "flashcard" | "counting" | "sorting"
  | "emotion" | "shapes" | "sequence" | "bubble-pop" | "opposite"
  | "dialogue" | "needs" | "odd-one-out" | "rhythm" | "word-category" | "color";

const GAME_DESCRIPTIONS: Record<GameId, string> = {
  "flashcard":       "บัตรคำ — ฝึกจำคำศัพท์ ภาษา การอ่าน",
  "picture-quiz":    "ชี้รูปภาพ — จดจำรูปกับคำ ฝึกภาษาและความเข้าใจ",
  "sorting":         "จัดหมวดหมู่ — ฝึกคิดแยกประเภท ตรรกะ",
  "counting":        "นับจำนวน — ฝึกคณิตศาสตร์เบื้องต้น สมาธิ",
  "matching":        "จับคู่ภาพ — ฝึกความจำระยะสั้น สมาธิ จดจำ pattern",
  "emotion":         "รู้จักอารมณ์ — ฝึก EQ อ่านความรู้สึก เหมาะ autism",
  "shapes":          "รูปทรงและสี — จับคู่รูปทรง/สี ฝึกการแยกแยะ cognitive",
  "sequence":        "เรียงลำดับ — เรียงเหตุการณ์ตามลำดับ ฝึกตรรกะ",
  "bubble-pop":      "ป๊อปบับเบิล — กดฟองเลขที่กำหนดภายในเวลา ฝึกสมาธิ",
  "opposite":        "คำตรงข้าม — ฝึกคลังคำศัพท์ ความเข้าใจภาษา",
  "dialogue":        "บทสนทนา — เลือกคำพูด/การกระทำที่ถูกต้องในสถานการณ์ ฝึกทักษะสังคม",
  "needs":           "บอกความต้องการ — เลือกวิธีบอกสิ่งที่ต้องการ เหมาะเด็กพูดช้า autism",
  "odd-one-out":     "หาตัวแปลก — จับผิดสิ่งที่ไม่เข้าพวก ฝึกสมาธิ การสังเกต",
  "rhythm":          "จับจังหวะสี — จำและกดสีตามลำดับ ฝึกความจำ กล้ามเนื้อ สมาธิ",
  "word-category":   "เลือกหมวดคำ — จัดหมวดคำศัพท์ ฝึกภาษาและการคิดจัดกลุ่ม",
  "color":           "ทายสีจากสิ่งของ — ดูเสื้อผ้า/ของใช้แล้วบอกสี ฝึกรู้จักสี 10 สีและชื่อสิ่งของ",
};

function getRuleBasedOrder(diagnosisKey: string, ageMonths: number): GameId[] {
  if (ageMonths > 0 && ageMonths < 30) {
    return ["picture-quiz", "color", "shapes", "counting", "needs", "flashcard", "rhythm", "bubble-pop", "matching", "sorting", "emotion", "sequence", "word-category", "opposite", "dialogue", "odd-one-out"];
  }
  const key = diagnosisKey.toLowerCase();
  if (key.includes("speech") || key.includes("พูด") || key.includes("ภาษา")) {
    return ["flashcard", "picture-quiz", "color", "needs", "opposite", "word-category", "emotion", "dialogue", "sorting", "counting", "shapes", "matching", "sequence", "bubble-pop", "odd-one-out", "rhythm"];
  }
  if (key.includes("adhd") || key.includes("สมาธิ")) {
    return ["bubble-pop", "rhythm", "odd-one-out", "counting", "sorting", "matching", "color", "shapes", "sequence", "picture-quiz", "flashcard", "emotion", "word-category", "opposite", "dialogue", "needs"];
  }
  if (key.includes("autism") || key.includes("asd") || key.includes("ออทิ")) {
    return ["emotion", "dialogue", "needs", "color", "sorting", "sequence", "matching", "shapes", "counting", "flashcard", "picture-quiz", "word-category", "odd-one-out", "opposite", "bubble-pop", "rhythm"];
  }
  if (key.includes("down") || key.includes("ดาวน์")) {
    return ["color", "shapes", "picture-quiz", "counting", "needs", "flashcard", "sorting", "emotion", "word-category", "matching", "sequence", "dialogue", "bubble-pop", "opposite", "odd-one-out", "rhythm"];
  }
  if (key.includes("global") || key.includes("พัฒนาการช้า")) {
    return ["color", "picture-quiz", "shapes", "counting", "needs", "flashcard", "emotion", "sorting", "matching", "bubble-pop", "word-category", "sequence", "odd-one-out", "dialogue", "opposite", "rhythm"];
  }
  return ["picture-quiz", "color", "flashcard", "emotion", "dialogue", "shapes", "counting", "needs", "sorting", "bubble-pop", "opposite", "word-category", "matching", "sequence", "odd-one-out", "rhythm"];
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

เรียงลำดับ 16 เกมจากเหมาะสมที่สุดไปน้อยสุด โดยพิจารณา:
1. ความต้องการพิเศษของเด็ก (ฝึกด้านที่อ่อนแอก่อน)
2. คะแนนที่ต่ำในประวัติ (ต้องฝึกซ้ำ)
3. ความหลากหลาย (ไม่ซ้ำเกมเดิมทุกวัน)

ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น:
{
  "order": ["game-id-1","game-id-2",...,"game-id-16"],
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
    const fallback = getRuleBasedOrder(diagnosisKey ?? "", ageMonths ?? 0);
    const finalOrder = [
      ...safeOrder,
      ...fallback.filter((id) => !safeOrder.includes(id)),
    ].slice(0, 16) as GameId[];

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
