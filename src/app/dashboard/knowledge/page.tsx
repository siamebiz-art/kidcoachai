"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-profile";
import { Search, BookOpen, Play, Clock, Bookmark, Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";

const ARTICLES = [
  {
    id: 1, title: "5 สัญญาณเตือนที่บ่งบอกว่าลูกอาจพูดช้า",
    category: "ภาษา", type: "บทความ", readTime: "5 นาที", emoji: "💬",
    color: "bg-emerald-50 border-emerald-100", badgeColor: "bg-emerald-100 text-emerald-700",
    summary: "เรียนรู้สัญญาณเตือนและวิธีช่วยลูกพัฒนาทักษะภาษาที่บ้าน",
    diagnosisKeys: ["speech_delay", "global_delay"],
    body: `**สัญญาณที่ควรสังเกต**\n\n1. **อายุ 12 เดือน** — ยังไม่พูดพยางค์ เช่น "มา" "ป๊า" "แม่"\n2. **อายุ 18 เดือน** — พูดคำศัพท์น้อยกว่า 10 คำ\n3. **อายุ 24 เดือน** — ยังไม่ต่อสองคำ เช่น "หมาตัวใหญ่"\n4. **อายุ 3 ปี** — คนนอกครอบครัวฟังไม่รู้เรื่องเกิน 50%\n5. **ทุกวัย** — พัฒนาการถดถอย เคยพูดได้แล้วหยุดพูด\n\n**วิธีช่วยที่บ้าน**\n\n- พูดคุยกับลูกตลอดวัน แม้ลูกยังตอบไม่ได้\n- ชี้และบอกชื่อสิ่งของรอบตัว "นั่นคือแมว สีส้ม"\n- อ่านนิทานทุกคืน ชี้รูปพร้อมพูดชื่อ\n- ลดเวลาหน้าจอ เพิ่มเวลาพูดคุยแบบหน้าต่อหน้า\n- ปรึกษานักบำบัดการพูด (Speech Therapist) หากกังวล`,
  },
  {
    id: 2, title: "เทคนิค Floor Time: เล่นกับลูกอย่างมีความหมาย",
    category: "การสื่อสาร", type: "คู่มือ", readTime: "8 นาที", emoji: "🤝",
    color: "bg-blue-50 border-blue-100", badgeColor: "bg-blue-100 text-blue-700",
    summary: "วิธีเล่นกับลูกที่ช่วยพัฒนาการสื่อสาร อารมณ์ และสมาธิ",
    diagnosisKeys: ["autism", "speech_delay", "global_delay"],
    body: `**Floor Time คืออะไร?**\n\nFloor Time (Developmental, Individual-difference, Relationship-based หรือ DIR) เป็นเทคนิคที่ Dr. Stanley Greenspan พัฒนา เน้นการ "ลงไปอยู่ระดับเดียวกับเด็ก" เพื่อสร้างการสื่อสารที่แท้จริง\n\n**6 ขั้นตอน Floor Time**\n\n1. **Follow the child's lead** — ตามสิ่งที่ลูกสนใจ อย่าบังคับ\n2. **Join & stay** — เข้าร่วมการเล่น อยู่กับลูก 20-30 นาที\n3. **Create circles** — สร้าง "วงกลมการสื่อสาร" โต้ตอบไปมา\n4. **Expand** — ขยายความสนใจของลูกอย่างค่อยเป็นค่อยไป\n5. **Don't direct** — อย่าสั่ง ให้ลูกนำ เราตาม\n6. **Celebrate** — ชื่นชมทุกความพยายาม ไม่ใช่แค่ผลลัพธ์\n\n**ทำวันละ 6 ครั้ง ครั้งละ 20 นาที** เพื่อผลลัพธ์ที่ดีที่สุด`,
  },
  {
    id: 3, title: "ABA Therapy คืออะไร ผู้ปกครองทำเองได้ไหม?",
    category: "ออทิสติก", type: "บทความ", readTime: "10 นาที", emoji: "🧩",
    color: "bg-purple-50 border-purple-100", badgeColor: "bg-purple-100 text-purple-700",
    summary: "ทำความเข้าใจ Applied Behavior Analysis และวิธีประยุกต์ใช้ที่บ้าน",
    diagnosisKeys: ["autism"],
    body: `**ABA คืออะไร?**\n\nApplied Behavior Analysis (ABA) เป็นการบำบัดพฤติกรรมที่มีหลักฐานทางวิทยาศาสตร์รองรับมากที่สุดสำหรับเด็กออทิสติก โดยใช้หลักการเรียนรู้และเสริมแรงบวก\n\n**หลักการพื้นฐานที่ผู้ปกครองทำได้**\n\n🟢 **Positive Reinforcement** — ให้รางวัลทันทีที่ลูกทำพฤติกรรมที่ต้องการ\n🟢 **Discrete Trial Training (DTT)** — แบ่งทักษะเป็นขั้นเล็กๆ สอนทีละขั้น\n🟢 **Natural Environment Teaching** — ฝึกในสถานการณ์จริง ไม่ใช่แค่ในห้อง\n🟢 **Prompting & Fading** — ช่วยเหลือตอนแรก ค่อยๆ ลดความช่วยเหลือลง\n\n**ควรปรึกษาผู้เชี่ยวชาญ** (BCBA — Board Certified Behavior Analyst) เพื่อออกแบบโปรแกรมที่เหมาะกับลูกโดยเฉพาะ`,
  },
  {
    id: 4, title: "วิธีจัดการลูกที่มีพฤติกรรม Meltdown",
    category: "ADHD", type: "คู่มือ", readTime: "7 นาที", emoji: "🌊",
    color: "bg-red-50 border-red-100", badgeColor: "bg-red-100 text-red-600",
    summary: "เทคนิครับมือและป้องกัน emotional meltdown ในเด็กพิเศษ",
    diagnosisKeys: ["adhd", "autism"],
    body: `**Meltdown vs Tantrum ต่างกันยังไง?**\n\n- **Tantrum** — ลูกควบคุมได้บ้าง ต้องการบางอย่าง มีผู้ชมก็ดียิ่งขึ้น\n- **Meltdown** — ลูกสูญเสียการควบคุมอย่างสมบูรณ์ ไม่ตอบสนองต่อการโน้มน้าว\n\n**ระหว่าง Meltdown ทำอะไร?**\n\n1. **ความปลอดภัยก่อน** — ย้ายออกจากสถานที่อันตราย\n2. **ลดสิ่งกระตุ้น** — ปิดเสียง ลดแสง ไปที่เงียบกว่า\n3. **อย่าพูดมาก** — พูดสั้นๆ เบาๆ หรือไม่พูดเลย\n4. **อยู่ใกล้ๆ ด้วยความสงบ** — อย่าโกรธตาม\n5. **รอให้ผ่านไป** — อย่าพยายามหยุดด้วยการต่อรอง\n\n**ป้องกัน Meltdown**\n\n- สังเกต trigger — เสียงดัง แสง ความหิว ความเหนื่อย\n- สร้าง routine ที่คาดเดาได้\n- สอน "emergency calm down" ก่อนเกิดเหตุ`,
  },
  {
    id: 5, title: "สอนลูกพูด: 10 กิจกรรมที่ทำได้ทุกวัน",
    category: "ภาษา", type: "วิดีโอ", readTime: "15 นาที", emoji: "🎬",
    color: "bg-amber-50 border-amber-100", badgeColor: "bg-amber-100 text-amber-700",
    summary: "กิจกรรมฝึกพูดง่ายๆ ที่ผู้ปกครองทำกับลูกได้ทุกวันที่บ้าน",
    diagnosisKeys: ["speech_delay", "global_delay"],
    body: `**10 กิจกรรมฝึกพูดที่บ้าน**\n\n1. 🍎 **ตั้งชื่อสิ่งของ** — ชี้ของรอบบ้าน พูดชื่อช้าๆ ชัดๆ\n2. 📖 **อ่านนิทานทุกคืน** — ชี้รูปถามว่า "นี่คืออะไร?"\n3. 🎵 **ร้องเพลงพร้อมกัน** — เพลงง่ายๆ ที่ซ้ำคำ\n4. 🪞 **เล่นหน้ากระจก** — ทำหน้าต่างๆ ออกเสียงต่างๆ\n5. 🫧 **เป่าฟองสบู่** — ฝึกกล้ามเนื้อปาก ลมหายใจ\n6. 🥤 **ดูดหลอด** — เสริมความแข็งแรงกล้ามเนื้อปาก\n7. 🧸 **เล่นสมมติ** — ให้ตุ๊กตาพูดคุยกัน\n8. 🔴 **เกมสี** — ชี้ของสีต่างๆ บอกชื่อสี\n9. 🍴 **บอกตอนกิน** — "นี่คือข้าว ร้อน อร่อย"\n10. 🤔 **ถามคำถามง่ายๆ** — "ใช่ หรือ ไม่ใช่?" ก่อน แล้วค่อยถามเปิด`,
  },
  {
    id: 6, title: "ดาวน์ซินโดรม: แผนพัฒนาการตามอายุ",
    category: "ดาวน์ซินโดรม", type: "คู่มือ", readTime: "12 นาที", emoji: "⭐",
    color: "bg-pink-50 border-pink-100", badgeColor: "bg-pink-100 text-pink-700",
    summary: "แนวทางพัฒนาการเด็กดาวน์ซินโดรมตั้งแต่แรกเกิดถึง 12 ปี",
    diagnosisKeys: ["down_syndrome"],
    body: `**แนวทางพัฒนาการตามช่วงอายุ**\n\n**แรกเกิด – 1 ปี**\n- กายภาพบำบัด เสริมความแข็งแรงกล้ามเนื้อ\n- กระตุ้นประสาทสัมผัส สัมผัส เสียง แสง\n- เริ่มบำบัดการพูด (Speech Therapy) ตั้งแต่เนิ่นๆ\n\n**1 – 3 ปี**\n- เน้นภาษาสัญลักษณ์ (Sign Language) ควบคู่กับการพูด\n- กิจกรรมบำบัด (OT) ฝึกกล้ามเนื้อมัดเล็ก\n- เล่นกับเพื่อนวัยเดียวกัน\n\n**3 – 6 ปี**\n- เข้าโปรแกรม Early Intervention\n- ฝึก self-care skills: แต่งตัว กินข้าวเอง\n- Inclusive education เรียนร่วมกับเด็กทั่วไป\n\n**6 – 12 ปี**\n- ทักษะวิชาการปรับตามความสามารถ\n- Social skills กลุ่มเพื่อน\n- ทักษะชีวิต เงิน การเดินทาง`,
  },
  {
    id: 7, title: "ADHD ในเด็ก: ช่วยลูกโฟกัสโดยไม่ต้องตะโกน",
    category: "ADHD", type: "บทความ", readTime: "8 นาที", emoji: "🎯",
    color: "bg-orange-50 border-orange-100", badgeColor: "bg-orange-100 text-orange-700",
    summary: "เทคนิคง่ายๆ ช่วยเด็ก ADHD มีสมาธิและทำงานให้เสร็จ",
    diagnosisKeys: ["adhd"],
    body: `**ทำไมเด็ก ADHD ถึงโฟกัสยาก?**\n\nสมองเด็ก ADHD มีระดับ dopamine ต่ำกว่าปกติ ทำให้ "เบรก" ความคิดได้ยาก ไม่ใช่เพราะดื้อหรือไม่ตั้งใจ\n\n**เทคนิคช่วยโฟกัส**\n\n⏱️ **Pomodoro สำหรับเด็ก**\n- เรียน 10-15 นาที → พัก 5 นาที → เรียนต่อ\n- ใช้นาฬิกาจับเวลาให้เห็น (visual timer)\n\n🎮 **Gamify งาน**\n- ทำรายการ checklist ให้ติ๊กเสร็จ\n- ให้แต้ม ให้รางวัลเล็กๆ\n\n🌿 **สิ่งแวดล้อม**\n- จัดโต๊ะเรียนให้ว่างเปล่า ลดของเล่น\n- หูฟัง noise-cancelling ถ้าเสียงรบกวน\n\n💪 **ออกกำลังก่อนเรียน**\n- วิ่ง กระโดด 10-15 นาที ช่วย dopamine ก่อนนั่งเรียน`,
  },
  {
    id: 8, title: "วิธีสร้าง Routine ที่ได้ผลสำหรับเด็กพิเศษ",
    category: "การสื่อสาร", type: "คู่มือ", readTime: "6 นาที", emoji: "📅",
    color: "bg-teal-50 border-teal-100", badgeColor: "bg-teal-100 text-teal-700",
    summary: "Routine ที่ดีช่วยลดวิตกกังวล เพิ่มความมั่นใจ และพัฒนา self-regulation",
    diagnosisKeys: ["autism", "adhd", "global_delay"],
    body: `**ทำไม Routine สำคัญ?**\n\nเด็กพิเศษมักวิตกกังวลกับสิ่งที่ไม่คาดเดาได้ Routine สร้าง "ความปลอดภัย" ให้สมอง\n\n**สร้าง Visual Schedule**\n\n1. ถ่ายรูปหรือวาดภาพทุกกิจกรรม\n2. ติดลำดับบนผนังในระดับสายตาเด็ก\n3. ให้เด็กติ๊กหรือพลิกภาพเมื่อทำเสร็จ\n\n**ตัวอย่าง Morning Routine**\n\n🌅 ตื่น → 🚿 อาบน้ำ → 👕 แต่งตัว → 🍳 กินข้าว → 🎒 เตรียมกระเป๋า → 🚌 ไปโรงเรียน\n\n**เคล็ดลับ**\n- แจ้งล่วงหน้าก่อนเปลี่ยน "อีก 5 นาทีจะ..."\n- First-Then: "ทำการบ้านก่อน แล้วค่อยดูทีวี"\n- Routine เดิมทุกวัน แม้วันหยุด`,
  },
  {
    id: 9, title: "โภชนาการสำหรับเด็กที่มีความต้องการพิเศษ",
    category: "สุขภาพ", type: "บทความ", readTime: "9 นาที", emoji: "🥗",
    color: "bg-green-50 border-green-100", badgeColor: "bg-green-100 text-green-700",
    summary: "อาหารที่ช่วยพัฒนาสมอง และจัดการกับ picky eating",
    diagnosisKeys: ["autism", "adhd", "global_delay", "down_syndrome"],
    body: `**สารอาหารสำคัญสำหรับสมองเด็ก**\n\n🐟 **Omega-3** (ปลาแซลมอน ปลาทูน่า) — ช่วยการทำงานของสมอง\n🥦 **Iron** (ผักใบเขียว เนื้อแดง) — ขาด Iron ทำให้ซึม สมาธิสั้น\n🍌 **Magnesium** (กล้วย ถั่ว) — ลดวิตกกังวล\n🥚 **Choline** (ไข่ เนื้อไก่) — สร้าง neurotransmitter\n\n**จัดการ Picky Eating**\n\n- แนะนำอาหารใหม่ซ้ำ 10-15 ครั้ง ก่อนปฏิเสธจริง\n- จัดอาหารให้น่าสนใจ รูปสัตว์ สีสันสวย\n- ให้ลูกช่วยทำอาหาร มีส่วนร่วม\n- อย่าบังคับ สร้าง food trauma\n- ปรึกษาโภชนาการบำบัดถ้ากินจำเพาะมาก`,
  },
  {
    id: 10, title: "การนอนหลับในเด็กออทิสติกและวิธีแก้ปัญหา",
    category: "ออทิสติก", type: "บทความ", readTime: "7 นาที", emoji: "🌙",
    color: "bg-indigo-50 border-indigo-100", badgeColor: "bg-indigo-100 text-indigo-700",
    summary: "ทำไมเด็กออทิสติกนอนยาก และวิธีสร้าง sleep routine ที่ได้ผล",
    diagnosisKeys: ["autism"],
    body: `**ทำไมเด็กออทิสติกนอนยาก?**\n\n- Melatonin ผลิตน้อยกว่าปกติ\n- ประสาทสัมผัสไวเกิน (เสียง แสง ผ้า)\n- วิตกกังวลสูง\n- Circadian rhythm ผิดปกติ\n\n**Sleep Hygiene สำหรับเด็กออทิสติก**\n\n🌙 **Bedtime Routine ที่ชัดเจน**\n- อาบน้ำ → แปรงฟัน → อ่านนิทาน → ปิดไฟ\n- เวลาเดิมทุกคืน แม้วันหยุด\n\n💡 **สภาพแวดล้อมห้องนอน**\n- ปิดม่านทึบ แสงน้อย\n- เสียง white noise ถ้าไวต่อเสียง\n- ผ้าห่มถ่วงน้ำหนัก (weighted blanket) ช่วย proprioception\n\n📵 **ก่อนนอน 1 ชั่วโมง**\n- งดหน้าจอทุกชนิด\n- งดกิจกรรมเร้าอารมณ์`,
  },
  {
    id: 11, title: "สร้างสัมพันธ์พี่น้องเมื่อน้องหรือพี่มีความต้องการพิเศษ",
    category: "ครอบครัว", type: "คู่มือ", readTime: "8 นาที", emoji: "👨‍👩‍👧‍👦",
    color: "bg-rose-50 border-rose-100", badgeColor: "bg-rose-100 text-rose-700",
    summary: "วิธีอธิบายให้พี่น้องเข้าใจ และดูแลสุขภาพจิตทุกคนในครอบครัว",
    diagnosisKeys: ["autism", "adhd", "global_delay", "down_syndrome", "speech_delay"],
    body: `**พูดคุยกับพี่หรือน้องอย่างไร?**\n\n**เด็ก 3-5 ปี**: "น้องสมองทำงานต่างจากเรา เหมือนเราทุกคนต่างกัน"\n\n**เด็ก 6-12 ปี**: อธิบายตรงๆ ว่า Autism/ADHD คืออะไร บอกว่าไม่ใช่ความผิดของใคร\n\n**เด็กโต**: ให้อ่านหนังสือ/ดูวิดีโอเกี่ยวกับความต้องการพิเศษ\n\n**ดูแลพี่น้องคนที่ "ปกติ"**\n\n- ให้เวลา one-on-one สม่ำเสมอ\n- รับฟังความรู้สึก "ไม่ยุติธรรม" โดยไม่ตัดสิน\n- อย่าให้แบกภาระดูแลน้องมากเกินไป\n- เปิดโอกาสให้พูดถึงความเครียด\n\n**ดูแลตัวเองในฐานะพ่อแม่**\n\n- Caregiver fatigue เป็นเรื่องจริง ไม่ใช่ความอ่อนแอ\n- หา support group ผู้ปกครองเด็กพิเศษ`,
  },
  {
    id: 12, title: "เทคโนโลยี AAC: เมื่อลูกสื่อสารด้วยการพูดไม่ได้",
    category: "ภาษา", type: "บทความ", readTime: "10 นาที", emoji: "📱",
    color: "bg-cyan-50 border-cyan-100", badgeColor: "bg-cyan-100 text-cyan-700",
    summary: "อุปกรณ์และแอปช่วยสื่อสาร (AAC) สำหรับเด็กที่พูดได้น้อยหรือพูดไม่ได้",
    diagnosisKeys: ["autism", "speech_delay", "global_delay"],
    body: `**AAC คืออะไร?**\n\nAugmentative and Alternative Communication (AAC) คือเครื่องมือเสริมหรือทดแทนการพูด ตั้งแต่การใช้ภาพ ไปจนถึงอุปกรณ์ high-tech\n\n**ระดับของ AAC**\n\n📸 **No-tech / Low-tech**\n- PECS (Picture Exchange Communication System)\n- กระดานภาพ Communication boards\n- ภาษามือ (Sign Language)\n\n📱 **High-tech**\n- แอป Proloquo2Go, TouchChat, LAMP\n- Speech-generating devices\n\n**ความเชื่อผิดๆ**\n\n❌ "ถ้าให้ใช้ AAC ลูกจะไม่ยอมพูด"\n✅ งานวิจัยพบว่า AAC ช่วยกระตุ้นการพูดจริงๆ ไม่ใช่ขัดขวาง\n\nปรึกษา SLP (Speech-Language Pathologist) เพื่อเลือก AAC ที่เหมาะกับลูก`,
  },
];

const categories = ["ทั้งหมด", "ภาษา", "การสื่อสาร", "ออทิสติก", "ADHD", "ดาวน์ซินโดรม", "สุขภาพ", "ครอบครัว"];

const typeIcons: Record<string, React.ReactNode> = {
  บทความ: <BookOpen className="w-3.5 h-3.5" />,
  คู่มือ: <BookOpen className="w-3.5 h-3.5" />,
  วิดีโอ: <Play className="w-3.5 h-3.5" />,
};

function renderBody(body: string) {
  return body.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-gray-900 mt-3 mb-1 first:mt-0">{line.replace(/\*\*/g, "")}</p>;
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

export default function KnowledgePage() {
  const { childProfile, bookmarkedArticles, toggleBookmark } = useProfile();
  const [cat, setCat] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const diagnosisKey = childProfile?.diagnosisKey ?? "";

  const recommended = ARTICLES.filter(
    (a) => diagnosisKey && a.diagnosisKeys.includes(diagnosisKey)
  );

  const filtered = ARTICLES.filter(
    (a) =>
      (cat === "ทั้งหมด" || a.category === cat) &&
      (search === "" || a.title.includes(search) || a.summary.includes(search))
  );

  const handleBookmark = async (e: React.MouseEvent, articleId: number) => {
    e.stopPropagation();
    setSavingId(articleId);
    try { await toggleBookmark(articleId); } finally { setSavingId(null); }
  };

  const isBookmarked = (id: number) => bookmarkedArticles.includes(id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คลังความรู้ผู้ปกครอง</h1>
        <p className="text-gray-500 text-sm mt-0.5">บทความ คู่มือ และวิดีโอ {ARTICLES.length} รายการ โดยผู้เชี่ยวชาญด้านพัฒนาการเด็ก</p>
      </div>

      {recommended.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-gray-900 text-sm">แนะนำสำหรับ{childProfile?.diagnosisLabel ?? "ลูก"}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recommended.map((article) => (
              <ArticleCard key={article.id} article={article} bookmarked={isBookmarked(article.id)}
                saving={savingId === article.id} highlighted open={openId === article.id}
                onToggle={() => setOpenId(openId === article.id ? null : article.id)}
                onBookmark={handleBookmark} />
            ))}
          </div>
        </div>
      )}

      {bookmarkedArticles.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">บันทึกไว้อ่าน</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {ARTICLES.filter((a) => bookmarkedArticles.includes(a.id)).map((article) => (
              <ArticleCard key={article.id} article={article} bookmarked saving={savingId === article.id}
                highlighted={false} open={openId === article.id}
                onToggle={() => setOpenId(openId === article.id ? null : article.id)}
                onBookmark={handleBookmark} />
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาบทความ..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white" />
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
              cat === c ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"
            }`}>{c}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} bookmarked={isBookmarked(article.id)}
            saving={savingId === article.id} highlighted={false} open={openId === article.id}
            onToggle={() => setOpenId(openId === article.id ? null : article.id)}
            onBookmark={handleBookmark} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📚</div>
          <p>ไม่พบบทความที่ค้นหา</p>
        </div>
      )}
    </div>
  );
}

type Article = (typeof ARTICLES)[0];

function ArticleCard({ article, bookmarked, saving, highlighted, open, onToggle, onBookmark }: {
  article: Article; bookmarked: boolean; saving: boolean;
  highlighted: boolean; open: boolean;
  onToggle: () => void;
  onBookmark: (e: React.MouseEvent, id: number) => void;
}) {
  return (
    <Card className={`border overflow-hidden ${article.color} ${highlighted ? "ring-2 ring-purple-300" : ""} transition-shadow hover:shadow-md`}>
      {/* Card header — always visible */}
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-4 pr-6 relative">
          <button onClick={(e) => onBookmark(e, article.id)} disabled={saving}
            className="absolute top-0 right-0 p-1 rounded-lg hover:bg-white/50 transition-colors"
            aria-label={bookmarked ? "ยกเลิกบันทึก" : "บันทึก"}>
            <Bookmark className={`w-4 h-4 transition-colors ${bookmarked ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`} />
          </button>

          <div className="text-3xl shrink-0">{article.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge className={`text-xs ${article.badgeColor} border-0`}>{article.category}</Badge>
              <Badge variant="outline" className="text-xs gap-1 py-0">
                {typeIcons[article.type]}{article.type}
              </Badge>
              {highlighted && <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 py-0 gap-1"><Sparkles className="w-3 h-3" /> แนะนำ</Badge>}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">{article.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{article.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />{article.readTime}
              </div>
              <div className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                {open ? <><X className="w-3 h-3" /> ปิด</> : <><ChevronDown className="w-3 h-3" /> อ่านต่อ</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable body */}
      {open && (
        <div className="px-5 pb-5 border-t border-black/5">
          <div className="pt-4 space-y-0.5">
            {renderBody(article.body)}
          </div>
          <button onClick={onToggle}
            className="mt-4 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <ChevronUp className="w-3 h-3" /> ย่อกลับ
          </button>
        </div>
      )}
    </Card>
  );
}
