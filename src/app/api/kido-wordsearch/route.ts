import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGuard, guardErrorResponse } from "@/lib/ai-guard";

const CATEGORY_LABELS: Record<string, string> = {
  animals: "animals (dog, cat, lion, bear, frog, deer, etc.)",
  food: "food and drinks (rice, cake, milk, corn, soup, etc.)",
  space: "space and astronomy (moon, star, mars, sun, orbit, comet)",
  school: "school items (pen, book, desk, ruler, chalk, pencil)",
  family: "family members (mom, dad, sister, brother, uncle, aunt)",
  sports: "sports and activities (swim, run, kick, jump, ball, race)",
  colors: "colors (red, blue, pink, gold, grey, green, white, black)",
  nature: "nature (tree, leaf, rain, wind, cloud, river, ocean, sand)",
};

const THAI_HINTS: Record<string, Record<string, string>> = {
  animals: { DOG:"หมา", CAT:"แมว", BIRD:"นก", FISH:"ปลา", LION:"สิงโต", BEAR:"หมี", FROG:"กบ", DUCK:"เป็ด", DEER:"กวาง", WOLF:"หมาป่า", CRAB:"ปู", SEAL:"แมวน้ำ", COW:"วัว", HEN:"ไก่", PIG:"หมู", APE:"ลิง", FOX:"จิ้งจอก", OWL:"นกฮูก", BEE:"ผึ้ง", ANT:"มด", ELEPHANT:"ช้าง", GIRAFFE:"ยีราฟ", TIGER:"เสือ", MONKEY:"ลิง", RABBIT:"กระต่าย", HORSE:"ม้า", SNAKE:"งู", SHARK:"ฉลาม", WHALE:"วาฬ", PANDA:"แพนด้า" },
  food: { RICE:"ข้าว", CAKE:"เค้ก", MILK:"นม", MEAT:"เนื้อ", EGG:"ไข่", SOUP:"ซุป", CORN:"ข้าวโพด", BEAN:"ถั่ว", APPLE:"แอปเปิ้ล", GRAPE:"องุ่น", BREAD:"ขนมปัง", FISH:"ปลา", SALT:"เกลือ", SUGAR:"น้ำตาล", PIZZA:"พิซซ่า", TOFU:"เต้าหู้", MANGO:"มะม่วง", LEMON:"มะนาว", BANANA:"กล้วย", ORANGE:"ส้ม" },
  space: { MOON:"ดวงจันทร์", STAR:"ดาว", MARS:"ดาวอังคาร", SUN:"ดวงอาทิตย์", EARTH:"โลก", VENUS:"ดาวศุกร์", ORBIT:"วงโคจร", COMET:"ดาวหาง", NEBULA:"เนบิวลา", PLUTO:"พลูโต", SATURN:"ดาวเสาร์", GALAXY:"กาแล็กซี", ROCKET:"จรวด", PLANET:"ดาวเคราะห์", METEOR:"อุกกาบาต", AURORA:"แสงเหนือ", ALIEN:"มนุษย์ต่างดาว", CRATER:"หลุมอุกกาบาต", SOLAR:"สุริยะ", SPACE:"อวกาศ" },
  school: { PEN:"ปากกา", BOOK:"หนังสือ", DESK:"โต๊ะ", RULER:"ไม้บรรทัด", PAPER:"กระดาษ", PENCIL:"ดินสอ", CHALK:"ชอล์ก", BOARD:"กระดาน", CLASS:"ห้องเรียน", ERASER:"ยางลบ", PAINT:"สีทา", GLOBE:"ลูกโลก", ATLAS:"แผนที่", COMPASS:"วงเวียน", SCISSOR:"กรรไกร", GLUE:"กาว" },
  family: { MOM:"แม่", DAD:"พ่อ", SISTER:"พี่สาว", BROTHER:"พี่ชาย", UNCLE:"ลุง", AUNT:"ป้า", GRANDMA:"ยาย", GRANDPA:"ตา", BABY:"ทารก", SON:"ลูกชาย", DAUGHTER:"ลูกสาว", COUSIN:"ลูกพี่ลูกน้อง", MOTHER:"แม่", FATHER:"พ่อ" },
  sports: { SWIM:"ว่ายน้ำ", RUN:"วิ่ง", KICK:"เตะ", JUMP:"กระโดด", BALL:"ลูกบอล", GOAL:"ประตู", RACE:"แข่ง", TEAM:"ทีม", WIN:"ชนะ", PLAY:"เล่น", HIT:"ตี", PASS:"ส่ง", CATCH:"รับ", THROW:"ขว้าง", SCORE:"คะแนน", COURT:"สนาม", MATCH:"การแข่งขัน" },
  colors: { RED:"แดง", BLUE:"น้ำเงิน", PINK:"ชมพู", GOLD:"ทอง", GREY:"เทา", GREEN:"เขียว", WHITE:"ขาว", BLACK:"ดำ", ORANGE:"ส้ม", PURPLE:"ม่วง", BROWN:"น้ำตาล", SILVER:"เงิน", VIOLET:"ม่วงอ่อน", YELLOW:"เหลือง" },
  nature: { TREE:"ต้นไม้", LEAF:"ใบไม้", RAIN:"ฝน", WIND:"ลม", CLOUD:"เมฆ", RIVER:"แม่น้ำ", OCEAN:"มหาสมุทร", SAND:"ทราย", ROCK:"หิน", FLOWER:"ดอกไม้", GRASS:"หญ้า", LAKE:"ทะเลสาบ", HILL:"เนิน", CAVE:"ถ้ำ", SNOW:"หิมะ", STORM:"พายุ", FOREST:"ป่า", BEACH:"ชายหาด" },
};

export async function POST(req: Request) {
  const guard = await aiGuard("kido-wordsearch");
  if (!guard.ok) return guardErrorResponse(guard);

  const { category = "animals", level = "easy", childAge = 7 } = (await req.json()) as {
    category?: string;
    level?: "easy" | "medium" | "hard";
    childAge?: number;
  };

  const wordCount = level === "easy" ? 6 : level === "medium" ? 8 : 10;
  const maxLen    = level === "easy" ? 6 : level === "medium" ? 8 : 10;
  const catLabel  = CATEGORY_LABELS[category] ?? category;
  const thaiMap   = THAI_HINTS[category] ?? {};

  const prompt = `Generate exactly ${wordCount} English uppercase words for a children's word search puzzle.
Category: ${catLabel}
Child age: ${childAge} years
Rules:
- Max ${maxLen} letters each, no spaces or hyphens
- Simple, common words appropriate for the age
- All UPPERCASE
- Return ONLY valid JSON, no markdown, no extra text

JSON format:
{"words":[{"word":"DOG","hint":"หมา"},{"word":"CAT","hint":"แมว"},...]}

Return the Thai hint (meaning) for each word. Vary the words, do not repeat.`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 400,
    });

    const raw = text.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw) as { words: { word: string; hint: string }[] };

    // Enrich hints from our lookup table, fallback to AI hint
    const enriched = parsed.words.map((w) => ({
      word: w.word.toUpperCase().replace(/[^A-Z]/g, ""),
      hint: thaiMap[w.word.toUpperCase()] ?? w.hint,
    })).filter((w) => w.word.length >= 3 && w.word.length <= maxLen);

    return Response.json({ words: enriched });
  } catch (err) {
    console.error("kido-wordsearch error:", err);
    // Fallback word list
    const fallback = Object.entries(thaiMap)
      .filter(([w]) => w.length >= 3 && w.length <= maxLen)
      .slice(0, wordCount)
      .map(([word, hint]) => ({ word, hint }));
    return Response.json({ words: fallback });
  }
}
