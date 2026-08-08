import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const STORY_TYPE_DESC: Record<string, string> = {
  bedtime:     "นิทานก่อนนอนที่อบอุ่น น่านอน พาเด็กผ่อนคลายและเตรียมนอนหลับ",
  eq:          "นิทานสอนการจัดการอารมณ์และ EQ ให้เด็กเข้าใจความรู้สึกตนเองและผู้อื่น",
  manners:     "นิทานสอนมารยาทและการช่วยเหลือผู้อื่น เป็นคนดีมีน้ำใจ",
  discipline:  "นิทานฝึกวินัยในตัวเองและความรับผิดชอบ",
  inspiration: "นิทานสร้างแรงบันดาลใจและความฝัน กล้าลองสิ่งใหม่",
};

const TYPE_VISUAL_STYLE: Record<string, string> = {
  bedtime:     "night sky, warm bedroom, glowing stars, cozy, soft moonlight",
  eq:          "bright sunny park, colorful emotions, cheerful friends",
  manners:     "friendly village, kind characters helping each other, warm daylight",
  discipline:  "school or home setting, determined child, trophy or achievement",
  inspiration: "magical adventure landscape, dreams and stars, heroic child",
};

export interface StoryScene {
  text: string;
  imagePrompt: string;
}

export interface IllustratedStory {
  title: string;
  scenes: StoryScene[];
}

export async function POST(req: Request) {
  const guard = await aiGuard("kido-story");
  if (!guard.ok) return guardErrorResponse(guard);

  const { childName, storyType, ageYears } = (await req.json()) as {
    childName: string;
    storyType: string;
    ageYears: number;
  };

  const typeDesc  = STORY_TYPE_DESC[storyType]  ?? "นิทานสนุกและสร้างสรรค์";
  const visualStyle = TYPE_VISUAL_STYLE[storyType] ?? "colorful magical world";
  const age       = Math.max(2, Math.min(12, ageYears || 5));

  const prompt = `แต่งนิทานภาษาไทยสำหรับเด็กอายุ ${age} ปี ชื่อตัวเอก "${childName}"
ประเภท: ${typeDesc}

แบ่งเนื้อเรื่องออกเป็น 4 ฉาก แต่ละฉาก 2-3 ประโยค รวม 200-280 คำ
สไตล์: น่ารัก เข้าใจง่าย มีคำอุทาน ข้อคิดอยู่ในเนื้อเรื่อง

ส่งกลับเป็น JSON เท่านั้น รูปแบบ:
{
  "title": "ชื่อนิทาน",
  "scenes": [
    {
      "text": "เนื้อเรื่องฉากที่ 1",
      "imagePrompt": "cute children book illustration, ${visualStyle}, [describe exactly what happens in this scene in English, 10-15 words], soft watercolor style, vibrant colors, no text, safe for kids"
    },
    {
      "text": "เนื้อเรื่องฉากที่ 2",
      "imagePrompt": "cute children book illustration, ${visualStyle}, [describe scene 2 in English], soft watercolor style, vibrant colors, no text, safe for kids"
    },
    {
      "text": "เนื้อเรื่องฉากที่ 3",
      "imagePrompt": "cute children book illustration, ${visualStyle}, [describe scene 3 in English], soft watercolor style, vibrant colors, no text, safe for kids"
    },
    {
      "text": "เนื้อเรื่องฉากที่ 4",
      "imagePrompt": "cute children book illustration, ${visualStyle}, [describe scene 4 in English], soft watercolor style, vibrant colors, no text, safe for kids"
    }
  ]
}

imagePrompt ต้องเป็นภาษาอังกฤษ บรรยายสิ่งที่เกิดในฉากนั้นอย่างชัดเจน
ห้ามเพิ่มข้อความอื่นนอกจาก JSON`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxOutputTokens: 1200,
  });

  try {
    const raw = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(raw) as IllustratedStory;
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) throw new Error("invalid");
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "ไม่สามารถสร้างนิทานได้ กรุณาลองใหม่" }, { status: 500 });
  }
}
