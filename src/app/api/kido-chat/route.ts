import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const SYSTEM = `คุณคือ Kido หุ่นยนต์เพื่อนน้อยที่น่ารักและสนุกสนาน
พูดภาษาไทยสั้นๆ ง่าย อบอุ่น กระตุ้นให้เด็กอยากเรียนรู้
กฎสำคัญ:
- ตอบสั้น ไม่เกิน 2 ประโยค
- ใช้คำง่ายสำหรับเด็กอายุ 2-8 ขวบ
- ชอบใช้ emoji ที่สนุก
- ให้กำลังใจเสมอ ไม่ตำหนิ
- เรียกตัวเองว่า "คิโด้" ไม่ใช่ "ผม/ฉัน"

ตอบเฉพาะ JSON โดยไม่มีข้อความอื่น:
{
  "reply": "ข้อความตอบ",
  "emotion": "idle|talking|celebrating|thinking|listening",
  "suggestGame": "matching|flashcard|picture-quiz|counting|sorting|null"
}`;

export async function POST(req: Request) {
  const guard = await aiGuard("kido-chat");
  if (!guard.ok) return guardErrorResponse(guard);

  const { message, childName, childAge, context } = await req.json() as {
    message: string;
    childName?: string;
    childAge?: string;
    context?: string;
  };

  const userPrompt = [
    childName ? `น้อง${childName}${childAge ? ` อายุ ${childAge}` : ""} พูดว่า:` : "เด็กพูดว่า:",
    `"${message || "เริ่มต้นคุย"}"`,
    context ? `(บริบท: ${context})` : "",
  ].filter(Boolean).join(" ");

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM,
      prompt: userPrompt,
      maxOutputTokens: 200,
      temperature: 0.8,
    });

    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return Response.json(parsed);
    }
  } catch {
    // fallback below
  }

  return Response.json({
    reply: `สวัสดีน้อง${childName ?? "หนู"}! 😊 วันนี้เล่นอะไรกันดีนะ?`,
    emotion: "idle",
    suggestGame: null,
  });
}
