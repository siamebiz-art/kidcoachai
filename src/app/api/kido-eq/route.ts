import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

export async function POST(req: Request) {
  const guard = await aiGuard("kido-eq");
  if (!guard.ok) return guardErrorResponse(guard);

  const { childName, emotion, ageYears } = (await req.json()) as {
    childName: string;
    emotion: string;
    ageYears: number;
  };

  const age = Math.max(2, Math.min(12, ageYears || 5));

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `คุณคือ Kido เพื่อนซี้ AI ของเด็ก พูดกับเด็กโดยตรง (ไม่ต้องแนะนำตัวว่าเป็น AI)

เด็กชื่อ "${childName}" อายุ ${age} ปี เพิ่งบอกว่าตอนนี้รู้สึก"${emotion}"

พูดกับ${childName}ใน 4-5 ประโยคโดย:
1. รับรู้ความรู้สึกด้วยความเข้าใจ (empathy) — ไม่ตัดสิน
2. ถามคำถามเพื่อให้เด็กเล่าเพิ่มเติม (1 คำถาม)
3. ให้กำลังใจและแนะนำกิจกรรมง่ายๆ ที่ทำได้ทันที เพื่อรับมือกับความรู้สึกนั้น
4. ปิดท้ายด้วยข้อความอบอุ่นที่ทำให้เด็กรู้สึกดีขึ้น + emoji สนุกๆ

ใช้ภาษาง่าย น่ารัก เหมาะกับเด็ก ${age} ปี`,
    maxOutputTokens: 250,
  });

  return Response.json({ response: text });
}
