import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const TH_LEVEL_DESC: Record<string, string> = {
  p1: "ป.1 — คำ 2-3 พยางค์ ใช้บ่อยในชีวิตประจำวัน เช่น แม่ พ่อ กิน เดิน วิ่ง",
  p2: "ป.2 — คำ 2-4 พยางค์ มีวรรณยุกต์ หรือสระซับซ้อนเล็กน้อย",
  p3: "ป.3 — คำ 3-5 พยางค์ รวมคำที่มีตัวสะกดและอักษรนำ",
  p4: "ป.4 — คำสุภาพ คำราชาศัพท์ง่าย คำที่มักเขียนผิด",
  p5: "ป.5 — คำศัพท์วิชาการง่าย ๆ และสำนวน",
  p6: "ป.6 — คำที่มักสับสน คำยากระดับ ป.ปลาย",
};

const EN_LEVEL_DESC: Record<string, string> = {
  p1: "Grade 1 — 3-4 letter CVC words like cat, dog, run, sit, big",
  p2: "Grade 2 — simple blends and digraphs like shop, fish, play, rain",
  p3: "Grade 3 — long vowel patterns, common sight words like bright, write",
  p4: "Grade 4 — multi-syllable words and common prefixes/suffixes",
  p5: "Grade 5 — academic vocabulary and irregular spelling patterns",
  p6: "Grade 6 — complex vocabulary suitable for upper primary",
};

export async function POST(req: Request) {
  const guard = await aiGuard("kido-spelling");
  if (!guard.ok) return guardErrorResponse(guard);

  const { level, language } = (await req.json()) as {
    level: string;
    language: "th" | "en";
  };

  const lang = language === "en" ? "en" : "th";

  const prompt = lang === "th"
    ? `สร้างคำศัพท์ภาษาไทยสำหรับฝึกสะกด ระดับ${TH_LEVEL_DESC[level] ?? TH_LEVEL_DESC["p3"]}

ส่งกลับเป็น JSON เท่านั้น รูปแบบ:
{"words":["คำ1","คำ2","คำ3","คำ4","คำ5","คำ6","คำ7","คำ8","คำ9","คำ10"]}

เลือกคำ 10 คำ ที่:
- เหมาะระดับชั้น
- หลากหลาย ไม่ซ้ำเรื่อง
- มีประโยชน์ในชีวิตประจำวัน
ห้ามเพิ่มข้อความอื่นนอกจาก JSON`
    : `Create 10 English spelling words for: ${EN_LEVEL_DESC[level] ?? EN_LEVEL_DESC["p3"]}

Return ONLY valid JSON in this exact format:
{"words":["word1","word2","word3","word4","word5","word6","word7","word8","word9","word10"]}

Choose 10 words that are:
- Appropriate for the level
- Varied in pattern
- Useful in everyday contexts
No additional text, only JSON.`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxOutputTokens: 200,
  });

  try {
    const parsed = JSON.parse(text.trim()) as { words: string[] };
    if (!Array.isArray(parsed.words)) throw new Error("invalid");
    return Response.json({ words: parsed.words.slice(0, 10) });
  } catch {
    const fallbackTh = ["แม่","พ่อ","เด็ก","น้ำ","ข้าว","บ้าน","โรงเรียน","ครู","เพื่อน","หนังสือ"];
    const fallbackEn = ["cat","dog","run","big","red","sun","hat","cup","pen","box"];
    return Response.json({ words: lang === "th" ? fallbackTh : fallbackEn });
  }
}
