import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const SUBJECT_CONTEXT: Record<string, string> = {
  thai:    "ภาษาไทย — การอ่าน การเขียน ไวยากรณ์ คำศัพท์ วรรณคดี",
  english: "ภาษาอังกฤษ — vocabulary, grammar, reading comprehension, writing",
  math:    "คณิตศาสตร์ — บวก ลบ คูณ หาร เศษส่วน โจทย์ปัญหา เลขาคณิต",
  science: "วิทยาศาสตร์ — ธรรมชาติ ร่างกาย พลังงาน สิ่งแวดล้อม ดาราศาสตร์",
  general: "ทั่วไป — ทุกวิชา",
};

export async function POST(req: Request) {
  const guard = await aiGuard("kido-homework");
  if (!guard.ok) return guardErrorResponse(guard);

  const { question, subject, childName, ageYears, history } = (await req.json()) as {
    question: string;
    subject: string;
    childName: string;
    ageYears: number;
    history: { role: string; text: string }[];
  };

  const subjectCtx = SUBJECT_CONTEXT[subject] ?? "ทั่วไป";
  const age = Math.max(4, Math.min(14, ageYears || 8));

  const historyBlock =
    history.length > 0
      ? "\n\nบทสนทนาก่อนหน้า:\n" +
        history
          .slice(-6)
          .map((m) => `${m.role === "user" ? childName : "Kido"}: ${m.text}`)
          .join("\n")
      : "";

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `คุณคือ Kido ครูพี่เลี้ยง AI ที่อบอุ่นและสนุกสนานสำหรับเด็กชื่อ "${childName}" อายุ ${age} ปี
วิชา: ${subjectCtx}

กฎสำคัญ:
1. ไม่เฉลยคำตอบตรงๆ — ช่วยให้เด็กคิดเอง ถามนำทาง
2. อธิบายทีละขั้นตอน สั้นกระชับ ไม่เกิน 3 ขั้นต่อครั้ง
3. ใช้ภาษาง่าย น่ารัก + emoji เหมาะกับเด็ก ${age} ปี
4. ยกตัวอย่างที่ใกล้ตัวเด็กในชีวิตประจำวัน
5. ให้กำลังใจเสมอ ไม่ตำหนิ
6. ตอบสั้น ≤120 คำต่อครั้ง${historyBlock}`,
    prompt: question,
    maxOutputTokens: 280,
  });

  return result.toTextStreamResponse();
}
