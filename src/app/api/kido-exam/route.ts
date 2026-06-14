import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const SUBJECT_TH: Record<string, string> = {
  thai:    "ภาษาไทย",
  english: "ภาษาอังกฤษ",
  math:    "คณิตศาสตร์",
  science: "วิทยาศาสตร์",
  social:  "สังคมศึกษา",
};

export async function POST(req: Request) {
  const guard = await aiGuard("kido-exam");
  if (!guard.ok) return guardErrorResponse(guard);

  const { mode, subject, topic, level, childName } = (await req.json()) as {
    mode: "quiz" | "summary";
    subject: string;
    topic: string;
    level: string;
    childName: string;
  };

  const subjectTh = SUBJECT_TH[subject] ?? subject;
  const levelNum = parseInt(level.replace("p", "")) || 3;

  /* ── Summary mode — streaming ── */
  if (mode === "summary") {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt: `สรุปบทเรียน${subjectTh} เรื่อง "${topic}" สำหรับเด็ก ป.${levelNum} (อายุ ${levelNum + 5} ปี) ชื่อ "${childName}"

รูปแบบ:
📚 เรื่อง: [ชื่อเรื่อง]

✅ สิ่งที่ต้องรู้:
- [ประเด็นสำคัญ 1]
- [ประเด็นสำคัญ 2]
- [ประเด็นสำคัญ 3]
- [ประเด็นสำคัญ 4]
- [ประเด็นสำคัญ 5]

💡 จำง่ายๆ: [เคล็ดลับหรือประโยคช่วยจำ 1-2 ประโยค]

⭐ Kido Tips: [ข้อแนะนำสำหรับการสอบ 1 ประโยค]

ใช้ภาษาง่าย สั้น กระชับ เหมาะเด็ก ป.${levelNum}`,
      maxOutputTokens: 500,
    });
    return result.toTextStreamResponse();
  }

  /* ── Quiz mode — JSON ── */
  const prompt = `สร้างข้อสอบแบบปรนัย (Multiple Choice) วิชา${subjectTh} เรื่อง "${topic}" สำหรับเด็ก ป.${levelNum}

ส่งกลับเป็น JSON เท่านั้น รูปแบบ:
{
  "questions": [
    {
      "q": "คำถาม",
      "c": ["ตัวเลือก A","ตัวเลือก B","ตัวเลือก C","ตัวเลือก D"],
      "a": 0,
      "e": "คำอธิบายว่าทำไมตอบนี้ถึงถูก"
    }
  ]
}

กฎ:
- สร้าง 5 ข้อ
- "a" คือ index (0-3) ของตัวเลือกที่ถูก
- ใช้ภาษาไทยที่เด็ก ป.${levelNum} เข้าใจได้
- คำอธิบายสั้น ไม่เกิน 1 ประโยค
- สลับตำแหน่งคำตอบที่ถูกให้หลากหลาย
ห้ามเพิ่มข้อความอื่นนอกจาก JSON`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxOutputTokens: 800,
  });

  try {
    const parsed = JSON.parse(text.trim()) as { questions: { q: string; c: string[]; a: number; e: string }[] };
    if (!Array.isArray(parsed.questions)) throw new Error("invalid");
    return Response.json({ questions: parsed.questions.slice(0, 5) });
  } catch {
    return Response.json({ error: "ไม่สามารถสร้างข้อสอบได้ กรุณาลองใหม่" }, { status: 500 });
  }
}
