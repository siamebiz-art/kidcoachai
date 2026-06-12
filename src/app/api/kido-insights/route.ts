import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";
import type { GameSession } from "@/lib/types";

export async function POST(req: Request) {
  const guard = await aiGuard("kido-chat");
  if (!guard.ok) return guardErrorResponse(guard);

  const { sessions, childName } = (await req.json()) as {
    sessions: GameSession[];
    childName?: string;
  };

  if (!sessions || sessions.length === 0) {
    return Response.json({ insights: "ยังไม่มีข้อมูลเพียงพอ เล่นเกมสัก 3 รอบก่อนนะ 🎮" });
  }

  const name = childName ?? "น้อง";

  const summary = sessions
    .map((s) => `- ${s.gameName} (${s.date}): ${s.score}/${s.total} = ${s.accuracy}%`)
    .join("\n");

  const prompt = `คุณคือ KidCoach AI ผู้ช่วยฝึกพัฒนาการเด็ก วิเคราะห์ข้อมูลการเล่นเกมของเด็กชื่อ "${name}" แล้วให้คำแนะนำผู้ปกครอง

ข้อมูลผลการเล่นเกม (เรียงจากล่าสุด):
${summary}

หมายเหตุ: เกมจับคู่ภาพ score=คู่ที่จับได้, total=จำนวนครั้งที่พลิก (ยิ่งน้อยยิ่งดี)

วิเคราะห์:
1. ด้านที่ ${name} ทำได้ดี (เกมไหน ทักษะอะไร)
2. ด้านที่ควรฝึกเพิ่ม (เกมไหน คะแนนต่ำ)
3. แนะนำกิจกรรมหรือเกมที่ควรเล่นต่อ (เฉพาะเจาะจง)

ตอบเป็นภาษาไทย อบอุ่น สั้นกระชับ 3-5 ประโยค ใช้ emoji ช่วย ห้ามวินิจฉัยโรคหรือบอกว่าแทนแพทย์`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 400,
    });
    return Response.json({ insights: text.trim() });
  } catch (err) {
    console.error("kido-insights error:", err);
    return Response.json({ error: "วิเคราะห์ไม่ได้ขณะนี้ ลองใหม่อีกครั้งนะ" }, { status: 500 });
  }
}
