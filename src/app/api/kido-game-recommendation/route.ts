import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";
import type { GameSession } from "@/lib/types";

type GameId =
  | "matching" | "picture-quiz" | "flashcard" | "counting" | "sorting"
  | "emotion" | "shapes" | "sequence" | "bubble-pop" | "opposite"
  | "dialogue" | "needs" | "odd-one-out" | "rhythm" | "word-category" | "color"
  | "quiz-fruits" | "quiz-pets" | "quiz-household" | "quiz-school" | "quiz-personal";

const GAME_DESCRIPTIONS: Record<GameId, string> = {
  "flashcard":       "บัตรคำ — ฝึกจำคำศัพท์ ภาษา การอ่าน",
  "picture-quiz":    "ชี้รูปภาพ (คละ) — จดจำรูปกับคำ ฝึกภาษาและความเข้าใจ",
  "quiz-fruits":     "ชี้รูปผลไม้ — จดจำชื่อผลไม้ 15 ชนิด ฝึกคำศัพท์ภาษาไทย",
  "quiz-pets":       "ชี้สัตว์เลี้ยง — จดจำชื่อสัตว์เลี้ยง 14 ชนิด ฝึกคำศัพท์",
  "quiz-household":  "ของในบ้าน — จดจำของใช้ในบ้าน 15 ชิ้น ฝึกคำศัพท์และลักษณนาม",
  "quiz-school":     "อุปกรณ์การเรียน — จดจำอุปกรณ์โรงเรียน 14 ชิ้น ฝึกคำศัพท์",
  "quiz-personal":   "ของใช้ส่วนตัว — จดจำของใช้ประจำวัน 14 ชิ้น ฝึกคำศัพท์",
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

const ALL_GAME_IDS = Object.keys(GAME_DESCRIPTIONS) as GameId[];

function getRuleBasedOrder(diagnosisKey: string, ageMonths: number): GameId[] {
  if (ageMonths > 0 && ageMonths < 30) {
    return ["quiz-fruits", "color", "shapes", "picture-quiz", "counting", "needs", "quiz-pets", "flashcard", "rhythm", "quiz-household", "bubble-pop", "matching", "sorting", "emotion", "sequence", "quiz-school", "word-category", "opposite", "dialogue", "odd-one-out", "quiz-personal"];
  }
  const key = diagnosisKey.toLowerCase();
  if (key.includes("speech") || key.includes("พูด") || key.includes("ภาษา")) {
    return ["flashcard", "picture-quiz", "quiz-fruits", "quiz-pets", "color", "needs", "opposite", "word-category", "quiz-household", "emotion", "dialogue", "sorting", "counting", "quiz-school", "shapes", "matching", "sequence", "bubble-pop", "odd-one-out", "rhythm", "quiz-personal"];
  }
  if (key.includes("adhd") || key.includes("สมาธิ")) {
    return ["bubble-pop", "rhythm", "odd-one-out", "counting", "sorting", "matching", "color", "shapes", "sequence", "picture-quiz", "flashcard", "quiz-fruits", "emotion", "word-category", "opposite", "quiz-pets", "dialogue", "needs", "quiz-household", "quiz-school", "quiz-personal"];
  }
  if (key.includes("autism") || key.includes("asd") || key.includes("ออทิ")) {
    return ["emotion", "dialogue", "needs", "color", "sorting", "sequence", "matching", "shapes", "counting", "flashcard", "picture-quiz", "quiz-fruits", "word-category", "odd-one-out", "opposite", "bubble-pop", "rhythm", "quiz-pets", "quiz-household", "quiz-school", "quiz-personal"];
  }
  if (key.includes("down") || key.includes("ดาวน์")) {
    return ["color", "shapes", "quiz-fruits", "picture-quiz", "counting", "needs", "flashcard", "sorting", "emotion", "quiz-pets", "word-category", "matching", "sequence", "dialogue", "quiz-household", "bubble-pop", "opposite", "odd-one-out", "rhythm", "quiz-school", "quiz-personal"];
  }
  if (key.includes("global") || key.includes("พัฒนาการช้า")) {
    return ["color", "quiz-fruits", "picture-quiz", "shapes", "counting", "needs", "flashcard", "emotion", "sorting", "matching", "quiz-pets", "bubble-pop", "word-category", "sequence", "odd-one-out", "dialogue", "opposite", "rhythm", "quiz-household", "quiz-school", "quiz-personal"];
  }
  return ["picture-quiz", "quiz-fruits", "color", "flashcard", "emotion", "dialogue", "shapes", "counting", "needs", "sorting", "quiz-pets", "bubble-pop", "opposite", "word-category", "matching", "sequence", "odd-one-out", "rhythm", "quiz-household", "quiz-school", "quiz-personal"];
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

เกมที่มีทั้งหมด 21 เกม:
${(Object.entries(GAME_DESCRIPTIONS) as [GameId, string][]).map(([id, desc]) => `- "${id}": ${desc}`).join("\n")}

เรียงลำดับทุกเกม (21 เกม) จากเหมาะสมที่สุดไปน้อยสุด โดยพิจารณา:
1. ความต้องการพิเศษของเด็ก (ฝึกด้านที่อ่อนแอก่อน)
2. คะแนนที่ต่ำในประวัติ (ต้องฝึกซ้ำ)
3. ความหลากหลาย (ไม่ซ้ำเกมเดิมทุกวัน)

ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น:
{
  "order": ["game-id-1","game-id-2",...,"game-id-21"],
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

    // validate all game IDs are valid, merge with fallback to always cover all 21 games
    const validIds = new Set(ALL_GAME_IDS);
    const safeOrder = data.order.filter((id) => validIds.has(id));
    const fallback = getRuleBasedOrder(diagnosisKey ?? "", ageMonths ?? 0);
    const finalOrder = [
      ...safeOrder,
      ...fallback.filter((id) => !safeOrder.includes(id)),
    ] as GameId[];

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
