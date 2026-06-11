"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { DIAGNOSIS_OPTIONS } from "@/lib/profile-utils";
import toast from "react-hot-toast";
import {
  User, Bell, Shield, CreditCard, Baby, Crown, Check, Loader2, Camera,
} from "lucide-react";

const CHILD_AVATARS = [
  "👦", "👧", "🧒", "👶",
  "🐱", "🐶", "🐻", "🐼",
  "🐸", "🦁", "🐯", "🐰",
  "🦊", "🐨", "🦄", "🐧",
  "⭐", "🌟", "🌈", "🌸",
];

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

  const { openUserProfile } = useClerk();
  const { isLoaded, childProfile, parentProfile, user, subscriptionTier, isPremium, updateChildProfile, updateParentProfile } = useProfile();
  const [isCheckingOut, setIsCheckingOut] = useState<"premium" | "pro" | null>(null);
  const [isPortaling, setIsPortaling] = useState(false);

  // Parent form
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Child form
  const [childName, setChildName] = useState("");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [childGender, setChildGender] = useState<"ชาย" | "หญิง" | "">("");
  const [childDiagnosisKey, setChildDiagnosisKey] = useState("");
  const [childAvatar, setChildAvatar] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // Reload Clerk user data after returning from Stripe checkout (run once only)
  const reloadedRef = useState(false);
  useEffect(() => {
    if (!isLoaded || !user || reloadedRef[0]) return;
    const success = searchParams.get("success");
    if (success === "1") {
      reloadedRef[1](true);
      user.reload().then(() => toast.success("อัปเกรดสำเร็จ! 🎉"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

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
      setChildAvatar(childProfile.avatar || "");
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
        avatar: childAvatar,
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
                <div className="relative group">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.imageUrl} alt={parentName} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                      {parentName ? parentName[0] : "พ"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => openUserProfile()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{parentName || "ยังไม่ได้ตั้งชื่อ"}</p>
                  <p className="text-xs text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
                  <button
                    type="button"
                    onClick={() => openUserProfile()}
                    className="mt-1 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                  >
                    <Camera className="w-3 h-3" />
                    เปลี่ยนรูปโปรไฟล์
                  </button>
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
                {/* Avatar picker */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">รูปประจำตัว</label>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center shadow-sm ring-2 ring-purple-200">
                      <span className="text-3xl select-none">
                        {childAvatar || (childGender === "ชาย" ? "👦" : "👧")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">เลือก emoji ด้านล่าง</p>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5">
                    {CHILD_AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setChildAvatar(emoji)}
                        className={`text-xl p-1.5 rounded-xl transition-all ${
                          childAvatar === emoji
                            ? "bg-purple-100 ring-2 ring-purple-400 scale-110"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

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
              {/* Current plan */}
              <Card className="p-5 border-gray-100 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">แผนปัจจุบัน</h2>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? "bg-amber-100" : "bg-gray-100"}`}>
                      <Crown className={`w-5 h-5 ${isPremium ? "text-amber-500" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 capitalize">{subscriptionTier === "free" ? "ฟรี" : subscriptionTier}</span>
                        <Badge className={isPremium ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
                          {subscriptionTier === "free" ? "ฟรี" : "ใช้งานอยู่"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isPremium ? "ฟีเจอร์ทั้งหมดพร้อมใช้งาน" : "AI Chat 10 ครั้ง/เดือน · แผน 3 วัน"}
                      </p>
                    </div>
                  </div>
                  {isPremium && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPortaling}
                      onClick={async () => {
                        setIsPortaling(true);
                        try {
                          const res = await fetch("/api/customer-portal", { method: "POST" });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                          else toast.error("ไม่สามารถเปิดหน้าจัดการได้");
                        } catch { toast.error("เกิดข้อผิดพลาด"); }
                        finally { setIsPortaling(false); }
                      }}
                      className="border-gray-200 text-gray-700 gap-2"
                    >
                      {isPortaling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      จัดการ Subscription
                    </Button>
                  )}
                </div>
              </Card>

              {/* Upgrade plans */}
              {subscriptionTier !== "pro" && (
                <div className="grid md:grid-cols-2 gap-4">
                  {([
                    {
                      tier: "premium" as const,
                      name: "Premium",
                      price: "299",
                      color: "border-purple-500",
                      features: ["AI Coach ไม่จำกัด", "แผนฝึกรายวัน 7 วัน", "ติดตามผลพัฒนาการ", "กิจกรรม 500+ รายการ", "การแจ้งเตือนรายวัน"],
                      hidden: subscriptionTier === "premium",
                    },
                    {
                      tier: "pro" as const,
                      name: "Pro",
                      price: "599",
                      color: "border-amber-400",
                      features: ["ทุกอย่างใน Premium", "วิเคราะห์วิดีโอการฝึก", "วิเคราะห์การพูด", "รายงาน PDF", "Priority Support"],
                      hidden: false,
                    },
                  ] as const).filter((p) => !p.hidden).map((plan) => (
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
                      <Button
                        disabled={isCheckingOut !== null}
                        onClick={async () => {
                          setIsCheckingOut(plan.tier);
                          try {
                            const res = await fetch("/api/create-checkout", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ tier: plan.tier }),
                            });
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                            else toast.error("ไม่สามารถเปิดหน้าชำระเงินได้");
                          } catch { toast.error("เกิดข้อผิดพลาด"); }
                          finally { setIsCheckingOut(null); }
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
                      >
                        {isCheckingOut === plan.tier ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        อัปเกรดเป็น {plan.name}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
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
