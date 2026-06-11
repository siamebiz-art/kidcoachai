"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Baby,
  Plus,
  Crown,
  Check,
} from "lucide-react";

const tabs = [
  { id: "profile", label: "โปรไฟล์", icon: User },
  { id: "child", label: "ข้อมูลเด็ก", icon: Baby },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "billing", label: "แผนการสมัคร", icon: CreditCard },
  { id: "privacy", label: "ความเป็นส่วนตัว", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    trainingReminder: true,
    dailyRecord: true,
    weeklyReport: false,
    community: true,
    email: false,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ตั้งค่า</h1>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* Tab List */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon
                className={`w-4 h-4 ${activeTab === tab.id ? "text-purple-600" : "text-gray-400"}`}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "profile" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">ข้อมูลส่วนตัว</h2>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                    แม่
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="border-gray-200">
                  เปลี่ยนรูป
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "ชื่อ-นามสกุล", value: "คุณแม่ก้อย", placeholder: "" },
                  { label: "อีเมล", value: "mom@example.com", placeholder: "" },
                  { label: "เบอร์โทรศัพท์", value: "08X-XXX-XXXX", placeholder: "" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      defaultValue={field.value}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                ))}
              </div>
              <Button className="mt-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl">
                บันทึกการเปลี่ยนแปลง
              </Button>
            </Card>
          )}

          {activeTab === "child" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">ข้อมูลเด็ก</h2>
                <Button variant="outline" size="sm" className="border-gray-200 gap-2">
                  <Plus className="w-4 h-4" />
                  เพิ่มเด็ก
                </Button>
              </div>

              <div className="border border-purple-100 rounded-2xl p-4 bg-purple-50 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                      น
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-gray-900">น้องนุ่น</div>
                    <div className="text-sm text-gray-500">อายุ 4 ปี 2 เดือน</div>
                  </div>
                  <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200">
                    ใช้งานอยู่
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "วันเกิด", value: "15 มีนาคม 2563" },
                    { label: "เพศ", value: "หญิง" },
                    { label: "ความต้องการพิเศษ", value: "พูดช้า" },
                    { label: "ระดับพัฒนาการ", value: "ควรเฝ้าระวัง" },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="text-xs text-gray-500">{f.label}</div>
                      <div className="text-sm font-medium text-gray-800">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="border-gray-200 rounded-xl w-full">
                แก้ไขข้อมูล
              </Button>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">การแจ้งเตือน</h2>
              <div className="space-y-5">
                {[
                  { key: "trainingReminder", label: "เตือนเวลาฝึกกิจกรรม", desc: "แจ้งเตือนตามแผนที่ตั้งไว้" },
                  { key: "dailyRecord", label: "บันทึกผลประจำวัน", desc: "เตือนให้บันทึกผลตอนเย็น" },
                  { key: "weeklyReport", label: "รายงานรายสัปดาห์", desc: "สรุปพัฒนาการทุกสัปดาห์" },
                  { key: "community", label: "การแจ้งเตือนชุมชน", desc: "มีคนตอบโพสต์ของคุณ" },
                  { key: "email", label: "รับทาง Email", desc: "ส่งสรุปรายเดือนทาง Email" },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(v) =>
                        setNotifications((prev) => ({ ...prev, [item.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "billing" && (
            <div className="space-y-4">
              <Card className="p-5 border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="font-bold text-gray-900">แผนปัจจุบัน</div>
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">ฟรี</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  คุณใช้งานแผนฟรี บางฟีเจอร์อาจถูกจำกัด
                </p>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Premium",
                    price: "299",
                    color: "border-purple-500",
                    features: ["AI Coach ไม่จำกัด", "แผนฝึกรายวัน", "ติดตามผล", "กิจกรรม 500+", "Notification"],
                  },
                  {
                    name: "Pro",
                    price: "599",
                    color: "border-gray-200",
                    features: ["ทุกอย่างใน Premium", "วิเคราะห์วิดีโอ", "วิเคราะห์การพูด", "รายงาน PDF", "Priority Support"],
                  },
                ].map((plan) => (
                  <Card key={plan.name} className={`p-5 border-2 ${plan.color} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-gray-900">{plan.name}</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      ฿{plan.price}
                      <span className="text-base font-normal text-gray-400">/เดือน</span>
                    </div>
                    <ul className="space-y-2 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl">
                      อัปเกรดเป็น {plan.name}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">ความเป็นส่วนตัว</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <p className="leading-relaxed">
                  ข้อมูลของคุณและลูกถูกเก็บรักษาอย่างปลอดภัย ไม่มีการแชร์ข้อมูลส่วนตัวให้บุคคลที่สาม
                </p>
                <div className="space-y-2">
                  {[
                    "ลบข้อมูลการประเมิน",
                    "ลบประวัติการสนทนากับ AI",
                    "ส่งออกข้อมูลทั้งหมด",
                    "ลบบัญชีทั้งหมด",
                  ].map((action) => (
                    <button
                      key={action}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                        action.includes("ลบบัญชี")
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
