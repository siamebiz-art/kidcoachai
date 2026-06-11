"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { DIAGNOSIS_OPTIONS } from "@/lib/profile-utils";
import toast from "react-hot-toast";
import {
  User, Bell, Shield, CreditCard, Baby, Crown, Check, Loader2,
} from "lucide-react";

const tabs = [
  { id: "profile", label: "โปรไฟล์", icon: User },
  { id: "child", label: "ข้อมูลเด็ก", icon: Baby },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "billing", label: "แผนการสมัคร", icon: CreditCard },
  { id: "privacy", label: "ความเป็นส่วนตัว", icon: Shield },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notifications, setNotifications] = useState({
    trainingReminder: true, dailyRecord: true, weeklyReport: false, community: true, email: false,
  });

  const { isLoaded, childProfile, parentProfile, user, updateChildProfile, updateParentProfile } = useProfile();

  // Parent form
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Child form
  const [childName, setChildName] = useState("");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [childGender, setChildGender] = useState<"ชาย" | "หญิง" | "">("");
  const [childDiagnosisKey, setChildDiagnosisKey] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (parentProfile) {
      setParentName(parentProfile.displayName || "");
      setParentPhone(parentProfile.phone || "");
    }
    if (childProfile) {
      setChildName(childProfile.name || "");
      setChildBirthdate(childProfile.birthdate || "");
      setChildGender(childProfile.gender || "");
      setChildDiagnosisKey(childProfile.diagnosisKey || "");
    }
  }, [isLoaded, parentProfile, childProfile]);

  const handleSaveParent = async () => {
    if (!parentName.trim()) { toast.error("กรุณากรอกชื่อผู้ปกครอง"); return; }
    setIsSaving(true);
    try {
      await updateParentProfile({ displayName: parentName.trim(), phone: parentPhone.trim() });
      toast.success("บันทึกข้อมูลสำเร็จ!");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChild = async () => {
    if (!childName.trim()) { toast.error("กรุณากรอกชื่อเด็ก"); return; }
    setIsSaving(true);
    try {
      const diagnosisOption = DIAGNOSIS_OPTIONS.find((d) => d.key === childDiagnosisKey);
      await updateChildProfile({
        name: childName.trim(),
        birthdate: childBirthdate,
        gender: childGender,
        diagnosisKey: childDiagnosisKey,
        diagnosisLabel: diagnosisOption?.label || "ไม่ระบุ",
      });
      toast.success("บันทึกข้อมูลเด็กสำเร็จ!");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ตั้งค่า</h1>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-purple-600" : "text-gray-400"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">ข้อมูลผู้ปกครอง</h2>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                    {parentName ? parentName[0] : "พ"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{parentName || "ยังไม่ได้ตั้งชื่อ"}</p>
                  <p className="text-xs text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    ชื่อที่ใช้แสดง <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="เช่น คุณแม่ก้อย"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveParent}
                disabled={isSaving}
                className="mt-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </Card>
          )}

          {/* Child Info Tab */}
          {activeTab === "child" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">ข้อมูลเด็ก</h2>

              {childProfile && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 mb-5 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                      {childProfile.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{childProfile.name}</p>
                    <p className="text-xs text-gray-500">{childProfile.diagnosisLabel}</p>
                  </div>
                  <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200">ใช้งานอยู่</Badge>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    ชื่อเล่น <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="เช่น น้องนุ่น"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">วันเกิด</label>
                  <input
                    type="date"
                    value={childBirthdate}
                    onChange={(e) => setChildBirthdate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">เพศ</label>
                  <div className="flex gap-3">
                    {(["ชาย", "หญิง"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setChildGender(g)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          childGender === g
                            ? "border-purple-400 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {g === "ชาย" ? "👦 ชาย" : "👧 หญิง"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">ความต้องการพิเศษ</label>
                  <select
                    value={childDiagnosisKey}
                    onChange={(e) => setChildDiagnosisKey(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  >
                    <option value="">-- เลือกประเภท --</option>
                    {DIAGNOSIS_OPTIONS.map((d) => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSaveChild}
                disabled={isSaving}
                className="mt-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกข้อมูลเด็ก
              </Button>
            </Card>
          )}

          {/* Notifications Tab */}
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
                      onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <Card className="p-5 border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="font-bold text-gray-900">แผนปัจจุบัน</div>
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">ฟรี</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">คุณใช้งานแผนฟรี บางฟีเจอร์อาจถูกจำกัด</p>
              </Card>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Premium", price: "299", color: "border-purple-500",
                    features: ["AI Coach ไม่จำกัด", "แผนฝึกรายวัน", "ติดตามผล", "กิจกรรม 500+", "Notification"],
                  },
                  {
                    name: "Pro", price: "599", color: "border-gray-200",
                    features: ["ทุกอย่างใน Premium", "วิเคราะห์วิดีโอ", "วิเคราะห์การพูด", "รายงาน PDF", "Priority Support"],
                  },
                ].map((plan) => (
                  <Card key={plan.name} className={`p-5 border-2 ${plan.color} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-gray-900">{plan.name}</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      ฿{plan.price}<span className="text-base font-normal text-gray-400">/เดือน</span>
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

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-5">ความเป็นส่วนตัว</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <p className="leading-relaxed">
                  ข้อมูลของคุณและลูกถูกเก็บรักษาอย่างปลอดภัย ไม่มีการแชร์ข้อมูลส่วนตัวให้บุคคลที่สาม
                </p>
                <div className="space-y-2">
                  {["ลบข้อมูลการประเมิน", "ลบประวัติการสนทนากับ AI", "ส่งออกข้อมูลทั้งหมด", "ลบบัญชีทั้งหมด"].map(
                    (action) => (
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
                    )
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
