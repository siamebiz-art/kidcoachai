import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { currentUser } from "@clerk/nextjs/server";
import type { UserMetadata } from "@/lib/types";

const BASE_PROMPT = `คุณคือ KidCoach AI ผู้ช่วยฝึกพัฒนาการเด็กที่เป็นมิตรและเชี่ยวชาญ

บทบาทของคุณ:
- เป็น AI Learning Assistant และ AI Parent Assistant ที่ช่วยผู้ปกครองฝึกพัฒนาการเด็กที่บ้าน
- ให้คำแนะนำกิจกรรมฝึกพัฒนาการที่เหมาะสมกับอายุและความต้องการของเด็ก
- ตอบคำถามเกี่ยวกับพัฒนาการเด็ก เด็กพูดช้า เด็กพัฒนาการช้า เด็กออทิสติก เด็ก ADHD

สิ่งที่ต้องทำเสมอ:
- ตอบเป็นภาษาไทยอย่างอบอุ่นและเป็นกันเอง
- แนะนำกิจกรรมที่ทำได้ที่บ้านจริงๆ ไม่ซับซ้อน
- ให้กำลังใจผู้ปกครอง
- ใช้ emoji ช่วยให้ข้อความดูเป็นมิตร
- แบ่งคำแนะนำเป็นข้อๆ ให้เข้าใจง่าย

สิ่งที่ห้ามทำเด็ดขาด:
- ห้ามวินิจฉัยโรค หรือบอกว่าเด็กเป็นโรคอะไร
- ห้ามบอกว่าตัวเองทดแทนแพทย์หรือนักบำบัด
- ถ้าอาการดูรุนแรงหรือน่าเป็นห่วง ให้แนะนำให้ปรึกษาผู้เชี่ยวชาญด้วย

จำ: คุณคือ "ผู้ช่วยฝึกพัฒนาการ" ไม่ใช่แพทย์หรือนักบำบัด`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get child context from Clerk
  let childContext = "";
  try {
    const user = await currentUser();
    if (user) {
      const meta = (user.unsafeMetadata ?? {}) as UserMetadata;
      const cp = meta.childProfile;
      const la = meta.latestAssessment;
      if (cp) {
        childContext = `\n\nข้อมูลเด็กที่ผู้ปกครองกำลังดูแล:
- ชื่อ: ${cp.name}
- ความต้องการพิเศษ: ${cp.diagnosisLabel}`;
        if (la) {
          childContext += `\n- ผลประเมินล่าสุด: ภาษา ${la.scores.ภาษา}%, การสื่อสาร ${la.scores.การสื่อสาร}%, การเรียนรู้ ${la.scores.การเรียนรู้}%, สมาธิ ${la.scores.สมาธิ}%, กล้ามเนื้อ ${la.scores.กล้ามเนื้อ}%`;
        }
        childContext += `\n\nเมื่อผู้ปกครองถามเรื่องลูก ให้ใช้ชื่อ "${cp.name}" และคำนึงถึงความต้องการพิเศษของเด็กด้วย`;
      }
    }
  } catch {
    // Continue without child context if auth fails
  }

  const systemPrompt = BASE_PROMPT + childContext;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1000,
  });

  return result.toUIMessageStreamResponse();
}
