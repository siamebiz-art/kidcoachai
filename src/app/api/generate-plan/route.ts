import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { ChildProfile, AssessmentScores } from "@/lib/types";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

function calcAge(birthdate: string): string {
  if (!birthdate) return "ไม่ระบุ";
  const birth = new Date(birthdate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years <= 0) return `${months} เดือน`;
  return `${years} ปี ${months} เดือน`;
}

export async function POST(req: Request) {
  const guard = await aiGuard("generate-plan");
  if (!guard.ok) return guardErrorResponse(guard);
  const { userId } = guard;

  const { childProfile, assessmentScores } = (await req.json()) as {
    childProfile: ChildProfile;
    assessmentScores: AssessmentScores;
  };

  const age = childProfile.birthdate ? calcAge(childProfile.birthdate) : "ไม่ระบุ";

  const weakAreas = Object.entries(assessmentScores)
    .filter(([, s]) => s < 65)
    .map(([area]) => area)
    .join(", ") || "ทุกด้านอยู่ในเกณฑ์ดี";

  const prompt = `สร้างแผนฝึกกิจกรรมรายสัปดาห์ (7 วัน) สำหรับเด็กที่มีพัฒนาการช้า

ข้อมูลเด็ก:
- ชื่อ: ${childProfile.name}
- อายุ: ${age}
- ความต้องการพิเศษ: ${childProfile.diagnosisLabel}

คะแนนประเมินพัฒนาการ (เต็ม 100):
ภาษา: ${assessmentScores.ภาษา}%, การสื่อสาร: ${assessmentScores.การสื่อสาร}%, การเรียนรู้: ${assessmentScores.การเรียนรู้}%, สมาธิ: ${assessmentScores.สมาธิ}%, กล้ามเนื้อ: ${assessmentScores.กล้ามเนื้อ}%

ด้านที่ต้องเน้นพัฒนา: ${weakAreas}

สร้างแผนฝึก 7 วัน กิจกรรมเป็นแบบทำที่บ้านได้ ง่าย สนุก ใช้เวลา 5-15 นาที เน้นด้านที่คะแนนต่ำ

ตอบเป็น JSON เท่านั้น (ไม่มีข้อความอื่น):
{
  "monday": [{"time":"เช้า","activity":"ชื่อกิจกรรม","duration":"10 นาที","category":"ภาษา","description":"คำอธิบายสั้นๆ","tips":"เทคนิคสำหรับผู้ปกครอง"}],
  "tuesday": [...],
  "wednesday": [...],
  "thursday": [...],
  "friday": [...],
  "saturday": [...],
  "sunday": [...],
  "aiNote": "ข้อความให้กำลังใจผู้ปกครองสั้นๆ 1-2 ประโยค"
}`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 2500,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const plan = JSON.parse(jsonMatch[0]);
    return Response.json({ plan });
  } catch (err) {
    console.error("Plan generation error:", err);
    return Response.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
