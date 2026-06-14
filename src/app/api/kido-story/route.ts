import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const STORY_TYPE_DESC: Record<string, string> = {
  bedtime:     "นิทานก่อนนอนที่อบอุ่น น่านอน พาเด็กผ่อนคลายและเตรียมนอนหลับ",
  eq:          "นิทานสอนการจัดการอารมณ์และ EQ ให้เด็กเข้าใจความรู้สึกตนเองและผู้อื่น",
  manners:     "นิทานสอนมารยาทและการช่วยเหลือผู้อื่น เป็นคนดีมีน้ำใจ",
  discipline:  "นิทานฝึกวินัยในตัวเองและความรับผิดชอบ",
  inspiration: "นิทานสร้างแรงบันดาลใจและความฝัน กล้าลองสิ่งใหม่",
};

export async function POST(req: Request) {
  const guard = await aiGuard("kido-story");
  if (!guard.ok) return guardErrorResponse(guard);

  const { childName, storyType, ageYears } = (await req.json()) as {
    childName: string;
    storyType: string;
    ageYears: number;
  };

  const typeDesc = STORY_TYPE_DESC[storyType] ?? "นิทานสนุกและสร้างสรรค์";
  const age = Math.max(2, Math.min(12, ageYears || 5));

  const result = streamText({
    model: openai("gpt-4o-mini"),
    prompt: `เขียนนิทานภาษาไทยสำหรับเด็กอายุ ${age} ปี

ตัวเอก: "${childName}" (ชื่อนี้คือเด็กที่ฟังอยู่ ให้เด็กรู้สึกว่าตัวเองเป็นพระเอก/นางเอก)
ประเภท: ${typeDesc}
ความยาว: 300-400 คำ
สไตล์: เรียบง่าย น่ารัก ใช้ภาษาที่เด็กอายุ ${age} ปีเข้าใจได้ มีคำอุทาน เช่น โอ้โห! ว้าว! เพื่อให้สนุก
โครงสร้าง: ตอนต้น → ปัญหา/การผจญภัย → วิธีแก้ → บทสรุปที่อบอุ่น
ห้ามเพิ่มหัวข้อ "บทเรียน" หรือ "สรุป" ให้ใส่ข้อคิดไว้ในเนื้อเรื่องแทน

เขียนเฉพาะเนื้อนิทาน ไม่ต้องมีหัวข้อหรือชื่อเรื่อง`,
    maxOutputTokens: 700,
  });

  return result.toTextStreamResponse();
}
