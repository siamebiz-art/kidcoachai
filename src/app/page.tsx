import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Star,
  CheckCircle,
  MessageCircle,
  BarChart3,
  Calendar,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="KidCoach AI"
                width={160}
                height={48}
                className="h-11 w-auto object-contain"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-purple-600 transition-colors">
                ฟีเจอร์
              </a>
              <a href="#pricing" className="hover:text-purple-600 transition-colors">
                ราคา
              </a>
              <a href="#about" className="hover:text-purple-600 transition-colors">
                เกี่ยวกับเรา
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-gray-700">
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                >
                  เริ่มต้นฟรี
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI Coach ส่วนตัวสำหรับพัฒนาการเด็ก
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              ช่วยลูกเติบโต{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ได้ถูกทาง
              </span>
              <br />
              ด้วย AI Coach ที่เข้าใจลูกคุณ
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              แพลตฟอร์ม AI ที่ช่วยผู้ปกครองดูแลและพัฒนาศักยภาพเด็กที่บ้าน
              ไม่ว่าจะเป็นเด็กพูดช้า เด็กพัฒนาการช้า เด็กออทิสติก หรือเด็ก ADHD
              ด้วยแผนฝึกเฉพาะบุคคลที่ AI สร้างให้ทุกวัน
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-8 py-6 text-lg rounded-2xl shadow-lg shadow-purple-200"
                >
                  เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-200 text-purple-700 px-8 py-6 text-lg rounded-2xl"
                >
                  ดูตัวอย่าง Dashboard
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✓ ทดลองใช้ฟรี 14 วัน &nbsp;✓ ไม่ต้องผูกบัตร &nbsp;✓ ยกเลิกได้ทุกเมื่อ
            </p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-1 shadow-2xl shadow-purple-100 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center text-gray-400">
                <Brain className="w-24 h-24 mx-auto mb-4 text-purple-300" />
                <p className="text-lg font-medium text-purple-400">
                  Dashboard Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: "10,000+", label: "ครอบครัวใช้งาน" },
              { value: "95%", label: "ผู้ปกครองพอใจ" },
              { value: "500+", label: "กิจกรรมพัฒนาการ" },
              { value: "24/7", label: "AI Coach พร้อมช่วย" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-purple-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              ฟีเจอร์ทั้งหมด
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ทุกอย่างที่คุณต้องการ ในที่เดียว
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ระบบครบครัน ออกแบบมาเพื่อช่วยผู้ปกครองดูแลลูกได้จริงในชีวิตประจำวัน
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                color: "from-purple-500 to-violet-600",
                bg: "bg-purple-50",
                title: "ประเมินพัฒนาการ AI",
                desc: "แบบสอบถามอัจฉริยะวิเคราะห์พัฒนาการ 5 ด้าน ภาษา สังคม การเรียนรู้ สมาธิ กล้ามเนื้อ พร้อมรายงานผลทันที",
              },
              {
                icon: MessageCircle,
                color: "from-blue-500 to-cyan-600",
                bg: "bg-blue-50",
                title: "AI Coach 24 ชั่วโมง",
                desc: "ถามได้ทุกเรื่องเกี่ยวกับลูก AI วิเคราะห์และแนะนำแผนฝึกเฉพาะตัว เสมือนมีผู้เชี่ยวชาญอยู่ข้างๆ",
              },
              {
                icon: Calendar,
                color: "from-green-500 to-emerald-600",
                bg: "bg-green-50",
                title: "แผนฝึกรายวัน",
                desc: "AI สร้างแผนฝึกเฉพาะลูกคุณ ปรับความยากอัตโนมัติ มีกิจกรรมเช้า บ่าย เย็น ใช้เวลาไม่เกินวันละ 30 นาที",
              },
              {
                icon: BarChart3,
                color: "from-orange-500 to-amber-600",
                bg: "bg-orange-50",
                title: "ติดตามผลพัฒนาการ",
                desc: "กราฟและรายงานรายสัปดาห์ รายเดือน เห็นความก้าวหน้าชัดเจน แชร์ให้นักบำบัดหรือครูได้",
              },
              {
                icon: Star,
                color: "from-pink-500 to-rose-600",
                bg: "bg-pink-50",
                title: "กิจกรรมสร้างสรรค์",
                desc: "ฐานข้อมูลกิจกรรม 500+ รายการ เกม บัตรคำศัพท์ นิทาน แบบฝึกหัด AI คัดเลือกที่เหมาะกับลูกทุกวัน",
              },
              {
                icon: Shield,
                color: "from-indigo-500 to-purple-600",
                bg: "bg-indigo-50",
                title: "ศูนย์เรียนรู้ผู้ปกครอง",
                desc: "คอร์ส วิดีโอ คู่มือ บทความ โดยผู้เชี่ยวชาญ AI แนะนำเนื้อหาที่เหมาะกับลูกคุณโดยเฉพาะ",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}
                >
                  <div
                    className={`w-6 h-6 bg-gradient-to-br ${f.color} rounded-lg flex items-center justify-center`}
                  >
                    <f.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-amber-800 font-medium mb-2">
            ⚠️ ข้อสำคัญ: KidCoach AI คืออะไร
          </p>
          <p className="text-amber-700 text-sm leading-relaxed">
            KidCoach AI คือ <strong>ผู้ช่วยฝึกพัฒนาการ</strong> และ{" "}
            <strong>AI Learning Assistant</strong> เท่านั้น
            ไม่ใช่เครื่องมือวินิจฉัยโรคหรือรักษาโรค ไม่สามารถทดแทนแพทย์
            นักกิจกรรมบำบัด หรือนักแก้ไขการพูด หากสงสัยว่าลูกมีปัญหา
            กรุณาปรึกษาผู้เชี่ยวชาญด้วย
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ราคาที่คุ้มค่า เข้าถึงได้ทุกครอบครัว
            </h2>
            <p className="text-xl text-gray-600">
              เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "ฟรี",
                price: "0",
                period: "/เดือน",
                color: "border-gray-200",
                button: "border border-gray-300 text-gray-700 hover:bg-gray-50",
                features: [
                  "ประเมินพัฒนาการ 1 ครั้ง",
                  "AI Chat จำกัด 10 ครั้ง/เดือน",
                  "แผนฝึก 3 วัน",
                  "กิจกรรมพื้นฐาน",
                ],
              },
              {
                name: "Premium",
                price: "299",
                period: "/เดือน",
                color: "border-purple-500 shadow-xl shadow-purple-100",
                button:
                  "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
                badge: "ยอดนิยม",
                features: [
                  "AI Coach ไม่จำกัด",
                  "แผนฝึกรายวัน",
                  "ติดตามผลพัฒนาการ",
                  "กิจกรรม 500+ รายการ",
                  "รายงานรายสัปดาห์",
                  "Notification แจ้งเตือน",
                ],
              },
              {
                name: "Pro",
                price: "599",
                period: "/เดือน",
                color: "border-gray-200",
                button: "border border-purple-300 text-purple-700 hover:bg-purple-50",
                features: [
                  "ทุกอย่างใน Premium",
                  "วิเคราะห์วิดีโอการฝึก",
                  "วิเคราะห์การพูด",
                  "รายงานละเอียด PDF",
                  "ส่งรายงานให้นักบำบัด",
                  "Priority Support",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl p-8 border-2 ${plan.color} relative`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ฿{plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button className={`w-full rounded-xl ${plan.button}`}>
                    เริ่มต้นเลย
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            เริ่มพัฒนาลูกวันนี้ ก้าวแรกที่สำคัญที่สุด
          </h2>
          <p className="text-xl text-purple-100 mb-10">
            เข้าร่วมกับผู้ปกครองกว่า 10,000 ครอบครัว ที่ไว้วางใจ KidCoach AI
            ช่วยพัฒนาลูกอย่างถูกต้อง
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 px-10 py-6 text-lg rounded-2xl font-semibold"
            >
              เริ่มต้นฟรีวันนี้
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/logo.png"
              alt="KidCoach AI"
              width={130}
              height={40}
              className="h-9 w-auto object-contain brightness-0 invert"
            />
            <p className="text-sm text-center">
              © 2024 KidCoach AI. ผู้ช่วยฝึกพัฒนาการเด็ก ไม่ใช่เครื่องมือการแพทย์
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                นโยบายความเป็นส่วนตัว
              </a>
              <a href="#" className="hover:text-white transition-colors">
                ข้อตกลงการใช้งาน
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
