import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const LEVEL_GRADE: Record<string, string> = {
  "p1": "ป.1 (อายุ 6-7 ปี) — ประโยคสั้นมาก คำง่าย ไม่เกิน 5 บรรทัด",
  "p2": "ป.2 (อายุ 7-8 ปี) — ประโยคสั้น คำทั่วไป 5-8 บรรทัด",
  "p3": "ป.3 (อายุ 8-9 ปี) — ประโยคปานกลาง 8-10 บรรทัด",
  "p4": "ป.4 (อายุ 9-10 ปี) — ประโยคหลายส่วน 10-12 บรรทัด",
  "p5": "ป.5 (อายุ 10-11 ปี) — ประโยคซับซ้อนขึ้น 12-15 บรรทัด",
  "p6": "ป.6 (อายุ 11-12 ปี) — ระดับ ป.ปลาย ประโยคสมบูรณ์ 15-18 บรรทัด",
};

const TOPIC_PROMPTS: Record<string, Record<string, string>> = {
  th: {
    animals: "สัตว์น่ารักในประเทศไทย",
    nature:  "ธรรมชาติและสิ่งแวดล้อมรอบตัว",
    family:  "ครอบครัวและความรัก",
    school:  "ชีวิตในโรงเรียน",
    food:    "อาหารไทยอร่อยๆ",
    friends: "มิตรภาพและการช่วยเหลือ",
  },
  en: {
    animals: "animals and their habitats",
    nature:  "nature and the environment",
    family:  "family and love",
    school:  "school life and learning",
    food:    "healthy food and nutrition",
    friends: "friendship and kindness",
  },
};

export async function POST(req: Request) {
  const guard = await aiGuard("kido-reading");
  if (!guard.ok) return guardErrorResponse(guard);

  const { level, language, topic, childName } = (await req.json()) as {
    level: string;
    language: "th" | "en";
    topic: string;
    childName: string;
  };

  const levelDesc = LEVEL_GRADE[level] ?? LEVEL_GRADE["p3"];
  const lang = language === "en" ? "en" : "th";
  const topicDesc = TOPIC_PROMPTS[lang]?.[topic] ?? (lang === "th" ? "ชีวิตประจำวัน" : "everyday life");

  const prompt = lang === "th"
    ? `เขียนบทอ่านภาษาไทยสำหรับเด็กระดับ${levelDesc}
เรื่อง: ${topicDesc}
ชื่อเด็ก: "${childName}" (ใส่ชื่อนี้ในเรื่องด้วย)

กฎ:
- ใช้ภาษาไทยที่ถูกต้องตามระดับชั้น
- ย่อหน้าละ 2-3 ประโยค
- มีคำถามท้ายบท 3 ข้อ ขึ้นต้นด้วย "คำถาม:"
- สนุก น่ารัก ดึงดูดความสนใจเด็ก
- เขียนเฉพาะเนื้อหา ไม่ต้องมีชื่อเรื่องนำ`
    : `Write an English reading passage for a Thai student at grade level: ${levelDesc}
Topic: ${topicDesc}
Student name: "${childName}" (include this name in the story)

Rules:
- Simple, clear English matching the grade level
- 2-3 sentences per paragraph
- Add 3 comprehension questions at the end starting with "Questions:"
- Fun and engaging for children
- Write only the passage content without a title heading`;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxOutputTokens: 600,
  });

  return result.toTextStreamResponse();
}
