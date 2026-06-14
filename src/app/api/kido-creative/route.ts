import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

export async function POST(req: Request) {
  const guard = await aiGuard("kido-creative");
  if (!guard.ok) return guardErrorResponse(guard);

  const { type, childName, ageYears, data } = (await req.json()) as {
    type: "character";
    childName: string;
    ageYears: number;
    data: { name: string; emoji: string; trait1: string; trait2: string; power: string };
  };

  const age = Math.max(4, Math.min(12, ageYears || 6));

  if (type === "character") {
    const { name, emoji, trait1, trait2, power } = data;
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `เขียนประวัติตัวละครสั้นๆ สำหรับเด็กอายุ ${age} ปี ชื่อ "${childName}" ที่เพิ่งสร้างตัวละครนี้:
ชื่อตัวละคร: ${name} ${emoji}
นิสัย: ${trait1} และ ${trait2}
พลังพิเศษ: ${power}

เขียน 3-4 ประโยค สนุก น่ารัก เหมือนในการ์ตูน ใช้ภาษาง่าย ชมเด็กที่สร้างตัวละครนี้ด้วย`,
      maxOutputTokens: 150,
    });
    return Response.json({ bio: text });
  }

  return Response.json({ error: "Unknown type" }, { status: 400 });
}
