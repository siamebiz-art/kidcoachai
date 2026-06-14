import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const SUBJECT_CONTEXT: Record<string, string> = {
  thai:    "ภาษาไทย — การอ่าน การเขียน ไวยากรณ์ คำศัพท์ วรรณคดี",
  english: "ภาษาอังกฤษ — vocabulary, grammar, reading comprehension, writing",
  math:    "คณิตศาสตร์ — บวก ลบ คูณ หาร เศษส่วน โจทย์ปัญหา เรขาคณิต",
  science: "วิทยาศาสตร์ — ธรรมชาติ ร่างกาย พลังงาน สิ่งแวดล้อม ดาราศาสตร์",
  social:  "สังคมศึกษา — ประวัติศาสตร์ ภูมิศาสตร์ เศรษฐศาสตร์ หน้าที่พลเมือง",
  art:     "ศิลปะ — ทัศนศิลป์ ดนตรี นาฏศิลป์ งานฝีมือ",
  general: "ทั่วไป — ทุกวิชา",
};

const HINT_PROMPTS: Record<number, string> = {
  1: "ให้คำใบ้เล็กน้อยเกี่ยวกับแนวคิด โดยไม่บอกวิธีทำหรือคำตอบ (ประโยคเดียว)",
  2: "อธิบายวิธีคิดและแนวทางแก้ปัญหา แต่ยังไม่เฉลยคำตอบสุดท้าย",
  3: "เฉลยคำตอบพร้อมอธิบายวิธีทำทีละขั้นตอนให้เข้าใจ",
};

function buildSystem(childName: string, age: number, subject: string): string {
  const subjectCtx = SUBJECT_CONTEXT[subject] ?? "ทั่วไป";
  const ageGuidance =
    age <= 5  ? "ใช้ภาษาง่ายมาก ประโยคสั้น มีอุปมาและรูปภาพในใจ เหมาะเด็กเล็ก" :
    age <= 8  ? "ใช้ภาษาง่าย มีตัวอย่างใกล้ตัว ยกตัวอย่างในชีวิตประจำวัน" :
                "อธิบายเชิงเหตุผลได้ แต่ยังคงเข้าใจง่าย ไม่ใช้ศัพท์ยาก";

  return `คุณคือ Kido ครูพี่เลี้ยง AI สำหรับเด็กชื่อ "${childName}" อายุ ${age} ปี
วิชา: ${subjectCtx}
ระดับภาษา: ${ageGuidance}

กฎสำคัญ:
1. ห้ามเฉลยคำตอบตรงๆ ยกเว้นถูกขอโดยตรง — ช่วยให้เด็กคิดเอง
2. อธิบายทีละขั้น ≤ 3 ขั้นต่อครั้ง
3. ใช้ emoji เล็กน้อยเพื่อความสนุก
4. ยกตัวอย่างที่เด็กเห็นในชีวิตประจำวัน
5. ให้กำลังใจเสมอ ไม่ตำหนิ
6. ตอบ ≤120 คำ`;
}

export async function POST(req: Request) {
  const guard = await aiGuard("kido-homework");
  if (!guard.ok) return guardErrorResponse(guard);

  const {
    question, subject, childName, ageYears, history,
    imageBase64, imageType,
    mode, hintLevel, topic,
  } = (await req.json()) as {
    question?: string;
    subject: string;
    childName: string;
    ageYears: number;
    history?: { role: string; text: string }[];
    imageBase64?: string;
    imageType?: string;
    mode?: "chat" | "hint" | "practice";
    hintLevel?: number;
    topic?: string;
  };

  const age        = Math.max(4, Math.min(14, ageYears || 8));
  const subjectCtx = SUBJECT_CONTEXT[subject] ?? "ทั่วไป";
  const systemPrompt = buildSystem(childName, age, subject);

  const historyBlock =
    history && history.length > 0
      ? "\n\nบทสนทนาก่อนหน้า:\n" +
        history.slice(-6).map((m) => `${m.role === "user" ? childName : "Kido"}: ${m.text}`).join("\n")
      : "";

  /* ── Practice Generator ── */
  if (mode === "practice") {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt: `สร้างแบบฝึกหัด 5 ข้อ วิชา${subjectCtx} สำหรับเด็กอายุ ${age} ปี${topic ? ` เรื่อง "${topic}"` : ""}

รูปแบบ:
ข้อ 1: [โจทย์]
ข้อ 2: [โจทย์]
...ข้อ 5

สร้างโจทย์ที่ ${age <= 8 ? "ง่าย เหมาะกับเด็กเล็ก" : "ท้าทายนิดหน่อย"} ไม่มีเฉลย`,
      maxOutputTokens: 350,
    });
    return result.toTextStreamResponse();
  }

  /* ── Hint Mode ── */
  if (mode === "hint" && hintLevel) {
    const hintInstruction = HINT_PROMPTS[hintLevel] ?? HINT_PROMPTS[1];
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt + historyBlock,
      prompt: hintInstruction,
      maxOutputTokens: 200,
    });
    return result.toTextStreamResponse();
  }

  /* ── Image Vision (uses GPT-4o) ── */
  if (imageBase64) {
    const mimeType = imageType ?? "image/jpeg";
    const dataUrl  = `data:${mimeType};base64,${imageBase64}`;
    const text     = question?.trim() || "ดูโจทย์นี้แล้วสอนทีละขั้น ไม่ต้องเฉลยทันที";
    const result   = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text",  text },
            { type: "image", image: dataUrl },
          ],
        },
      ],
      maxOutputTokens: 350,
    });
    return result.toTextStreamResponse();
  }

  /* ── Regular Chat ── */
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt + historyBlock,
    prompt: question ?? "",
    maxOutputTokens: 280,
  });
  return result.toTextStreamResponse();
}
