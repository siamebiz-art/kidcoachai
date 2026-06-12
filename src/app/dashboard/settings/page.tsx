"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { DIAGNOSIS_OPTIONS } from "@/lib/profile-utils";
import toast from "react-hot-toast";
import {
  User, Bell, Shield, CreditCard, Baby, Crown, Check, Loader2, Camera, Timer,
} from "lucide-react";

const tabs = [
  { id: "profile",       label: "โปรไฟล์",       icon: User },
  { id: "child",         label: "ข้อมูลเด็ก",     icon: Baby },
  { id: "kido",          label: "Kido",            icon: Timer },
  { id: "notifications", label: "การแจ้งเตือน",   icon: Bell },
  { id: "billing",       label: "แผนการสมัคร",    icon: CreditCard },
  { id: "privacy",       label: "ความเป็นส่วนตัว", icon: Shield },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [notifications, setNotifications] = useState({
    trainingReminder: true, dailyRecord: true, weeklyReport: false, community: true, email: false,
  });

  const { openUserProfile } = useClerk();
  const { isLoaded, childProfile, parentProfile, user, subscriptionTier, isPremium, updateChildProfile, updateParentProfile, kidoSettings, updateKidoSettings, pendingPayment } = useProfile();
  const [isPortaling, setIsPortaling] = useState(false);

  const [isCheckingOut, setIsCheckingOut] = useState<"premium" | "pro" | null>(null);

  async function handleStripeCheckout(tier: "premium" | "pro") {
    setIsCheckingOut(tier);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error("ไม่สามารถเปิดหน้าชำระเงินได้");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsCheckingOut(null);
    }
  }

  // PromptPay modal
  const [showQRModal, setShowQRModal] = useState<"premium" | "pro" | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slipInputRef = useRef<HTMLInputElement>(null);

  // Parent form
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentAvatar, setParentAvatar] = useState("");
  const [parentAvatarUploading, setParentAvatarUploading] = useState(false);
  const parentAvatarInputRef = useRef<HTMLInputElement>(null);

  // Child form
  const [childName, setChildName] = useState("");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [childGender, setChildGender] = useState<"ชาย" | "หญิง" | "">("");
  const [childDiagnosisKey, setChildDiagnosisKey] = useState("");
  const [childAvatar, setChildAvatar] = useState("");
  const [childAvatarUploading, setChildAvatarUploading] = useState(false);
  const childAvatarInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Kido settings
  const [kidoLimitEnabled, setKidoLimitEnabled] = useState(false);
  const [kidoLimitMinutes, setKidoLimitMinutes] = useState(60);
  const [todayMinutes, setTodayMinutes] = useState(0);

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
    setKidoLimitEnabled((kidoSettings.dailyLimitMinutes ?? 0) > 0);
    setKidoLimitMinutes(kidoSettings.dailyLimitMinutes > 0 ? kidoSettings.dailyLimitMinutes : 60);
    // load today's usage from localStorage (client-side only)
    try {
      const raw = localStorage.getItem("kidocoachai-daily");
      if (raw) {
        const d = JSON.parse(raw) as { date: string; minutes?: number; screenMinutes?: number };
        const today = new Date().toISOString().slice(0, 10);
        setTodayMinutes(d.date === today ? (d.screenMinutes ?? d.minutes ?? 0) : 0);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, kidoSettings.dailyLimitMinutes]);

  useEffect(() => {
    if (!isLoaded) return;
    if (parentProfile) {
      setParentName(parentProfile.displayName || "");
      setParentPhone(parentProfile.phone || "");
      setParentAvatar(parentProfile.avatarUrl || "");
    }
    if (childProfile) {
      setChildName(childProfile.name || "");
      setChildBirthdate(childProfile.birthdate || "");
      setChildGender(childProfile.gender || "");
      setChildDiagnosisKey(childProfile.diagnosisKey || "");
      setChildAvatar(childProfile.avatar || "");
    }
  }, [isLoaded, parentProfile, childProfile]);

  const uploadParentPhoto = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("รองรับเฉพาะรูปภาพ"); return; }
    setParentAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("prefix", "parent");
      const res = await fetch("/api/upload-child-photo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      setParentAvatar(data.url);
      await updateParentProfile({
        displayName: parentName || parentProfile?.displayName || "",
        phone: parentPhone || parentProfile?.phone || "",
        avatarUrl: data.url,
      });
      toast.success("บันทึกรูปสำเร็จ!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setParentAvatarUploading(false);
    }
  };

  const uploadChildPhoto = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("รองรับเฉพาะรูปภาพ"); return; }
    setChildAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-child-photo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      setChildAvatar(data.url);
      // Auto-save avatar to Clerk immediately
      if (childProfile) {
        await updateChildProfile({ ...childProfile, avatar: data.url });
      }
      toast.success("บันทึกรูปสำเร็จ!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setChildAvatarUploading(false);
    }
  };

  const handleSaveKido = async () => {
    setIsSaving(true);
    try {
      await updateKidoSettings({ dailyLimitMinutes: kidoLimitEnabled ? kidoLimitMinutes : 0 });
      toast.success("บันทึกการตั้งค่า Kido สำเร็จ!");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveParent = async () => {
    if (!parentName.trim()) { toast.error("กรุณากรอกชื่อผู้ปกครอง"); return; }
    setIsSaving(true);
    try {
      await updateParentProfile({ displayName: parentName.trim(), phone: parentPhone.trim(), avatarUrl: parentAvatar });
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
                <div
                  className="relative w-16 h-16 rounded-full cursor-pointer group shrink-0"
                  onClick={() => parentAvatarInputRef.current?.click()}
                >
                  {parentAvatar?.startsWith("http") ? (
                    <Image src={parentAvatar} alt={parentName || "ผู้ปกครอง"} fill className="rounded-full object-cover" />
                  ) : (
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user?.imageUrl} alt={parentName} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                        {parentName ? parentName[0] : "พ"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {parentAvatarUploading
                      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                      : <Camera className="w-5 h-5 text-white" />
                    }
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{parentName || "ยังไม่ได้ตั้งชื่อ"}</p>
                  <p className="text-xs text-gray-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
                  <button
                    type="button"
                    onClick={() => parentAvatarInputRef.current?.click()}
                    disabled={parentAvatarUploading}
                    className="mt-1 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <Camera className="w-3 h-3" />
                    {parentAvatarUploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปโปรไฟล์"}
                  </button>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ไม่เกิน 5MB</p>
                </div>
              </div>
              <input
                ref={parentAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadParentPhoto(file);
                }}
              />
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
                {/* Child photo upload */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">รูปโปรไฟล์เด็ก</label>
                  <div className="flex items-center gap-4">
                    <div
                      className="relative w-20 h-20 rounded-full cursor-pointer group shrink-0"
                      onClick={() => childAvatarInputRef.current?.click()}
                    >
                      {childAvatar?.startsWith("http") ? (
                        <Image
                          src={childAvatar}
                          alt={childName || "เด็ก"}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center">
                          <span className="text-4xl select-none">
                            {childGender === "ชาย" ? "👦" : "👧"}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {childAvatarUploading
                          ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                          : <Camera className="w-6 h-6 text-white" />
                        }
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => childAvatarInputRef.current?.click()}
                        disabled={childAvatarUploading}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        {childAvatarUploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}
                      </button>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG ไม่เกิน 5MB</p>
                    </div>
                  </div>
                  <input
                    ref={childAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadChildPhoto(file);
                    }}
                  />
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

          {/* Kido Tab */}
          {activeTab === "kido" && (
            <Card className="p-6 border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain" />
                <div>
                  <h2 className="font-bold text-gray-900">Kido – AI Buddy ของลูก</h2>
                  <p className="text-xs text-gray-400">ตั้งค่าเวลาเล่นและการดูแลสุขภาพ</p>
                </div>
              </div>

              {/* Today usage */}
              <div className="bg-purple-50 rounded-2xl p-4 mb-5">
                <p className="text-xs text-gray-500 mb-1">วันนี้ลูกเล่นไปแล้ว</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-purple-600">{todayMinutes}</span>
                  <span className="text-sm text-gray-500 mb-1">นาที</span>
                </div>
                {kidoSettings.dailyLimitMinutes > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-purple-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (todayMinutes / kidoSettings.dailyLimitMinutes) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      จาก {kidoSettings.dailyLimitMinutes} นาที/วัน
                    </p>
                  </div>
                )}
              </div>

              {/* Daily limit toggle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">จำกัดเวลาเล่นต่อวัน</p>
                  <p className="text-xs text-gray-400 mt-0.5">Kido จะบอกให้พักเมื่อครบเวลา</p>
                </div>
                <Switch checked={kidoLimitEnabled} onCheckedChange={setKidoLimitEnabled} />
              </div>

              {kidoLimitEnabled && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-3">เวลาสูงสุดต่อวัน</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[30, 45, 60, 90].map((min) => (
                      <button
                        key={min}
                        onClick={() => setKidoLimitMinutes(min)}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          kidoLimitMinutes === min
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {min}<span className="text-xs font-normal"> นาที</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 shrink-0">กำหนดเอง:</span>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        min={10}
                        max={180}
                        value={![30, 45, 60, 90].includes(kidoLimitMinutes) ? kidoLimitMinutes : ""}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 10 && v <= 180) setKidoLimitMinutes(v);
                        }}
                        placeholder="10-180"
                        className="w-20 text-sm border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                      <span className="text-xs text-gray-400">นาที</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    💡 WHO แนะนำ 60 นาที/วัน สำหรับเด็ก 3-5 ปี
                  </p>
                </div>
              )}

              {/* Auto break info — 3-level system */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
                <p className="text-sm font-semibold text-amber-800 mb-2">🛡️ ระบบดูแลเวลาอัจฉริยะ (3 ระดับ)</p>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li>• <span className="font-semibold">ครบ 15 นาที:</span> Kido พูดเตือนให้ยืดเส้นยืดสาย</li>
                  <li>• <span className="font-semibold">ครบ 20 นาที:</span> ภารกิจออฟไลน์ (กระโดด กอดแม่ วาดรูป)</li>
                  <li>• <span className="font-semibold">ครบ 30 นาที:</span> พักบังคับ — มินิเกมออกกำลังกายกับ Kido</li>
                  <li>• <span className="font-semibold">ครบเวลาที่ตั้ง:</span> หยุดเล่นสำหรับวันนี้</li>
                </ul>
              </div>

              <Button
                onClick={handleSaveKido}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกการตั้งค่า Kido
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

              {/* Pending payment banner */}
              {pendingPayment && (
                <Card className={`p-4 border-2 shadow-sm ${
                  pendingPayment.status === "pending"     ? "border-amber-300 bg-amber-50" :
                  pendingPayment.status === "ai_approved" ? "border-green-300 bg-green-50" :
                  pendingPayment.status === "approved"    ? "border-green-300 bg-green-50" :
                                                            "border-red-300 bg-red-50"
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {pendingPayment.status === "pending"     && "⏳"}
                      {pendingPayment.status === "ai_approved" && "🤖"}
                      {pendingPayment.status === "approved"    && "✅"}
                      {pendingPayment.status === "rejected"    && "❌"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {pendingPayment.status === "pending"     && "รอตรวจสอบสลิปการชำระเงิน"}
                        {pendingPayment.status === "ai_approved" && "AI ตรวจสอบผ่านแล้ว — เปิดใช้งานแล้ว! 🎉"}
                        {pendingPayment.status === "approved"    && "ชำระเงินสำเร็จ — เปิดใช้งานแล้ว!"}
                        {pendingPayment.status === "rejected"    && "สลิปไม่ผ่านการตรวจสอบ"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        แพ็กเกจ {pendingPayment.tier} · ฿{pendingPayment.amount} · อ้างอิง {pendingPayment.ref}
                      </p>
                      {pendingPayment.aiCheck && (
                        <p className="text-xs text-gray-400 mt-1">
                          🤖 AI: {pendingPayment.aiCheck.bank} · ฿{pendingPayment.aiCheck.amount} · {pendingPayment.aiCheck.reason}
                        </p>
                      )}
                      {pendingPayment.status === "rejected" && pendingPayment.rejectedReason && (
                        <p className="text-xs text-red-600 mt-1">เหตุผล: {pendingPayment.rejectedReason}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

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

              {/* Upgrade plans — PromptPay */}
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
                      <div className="flex flex-col gap-2">
                        <Button
                          disabled={isCheckingOut !== null}
                          onClick={() => handleStripeCheckout(plan.tier)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
                        >
                          {isCheckingOut === plan.tier ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          💳 ชำระด้วยบัตรเครดิต
                        </Button>
                        <Button
                          disabled={pendingPayment?.status === "pending"}
                          onClick={() => setShowQRModal(plan.tier)}
                          variant="outline"
                          className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl gap-2"
                        >
                          📱 ชำระผ่าน PromptPay
                        </Button>
                        {pendingPayment?.status === "pending" && (
                          <p className="text-xs text-center text-amber-600">รอตรวจสอบสลิปอยู่...</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* PromptPay info note */}
              <p className="text-xs text-center text-gray-400">
                ชำระผ่าน PromptPay · โอนเงินแล้วอัปโหลดสลิป · ทีมงานเปิดใช้งานภายใน 24 ชั่วโมง
              </p>
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
      {/* PromptPay QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">ชำระผ่าน PromptPay</h3>
              <button
                onClick={() => { setShowQRModal(null); setSlipFile(null); setSlipPreview(""); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Price */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 mb-1">แพ็กเกจ {showQRModal === "premium" ? "Premium" : "Pro"}</p>
              <p className="text-4xl font-bold text-purple-600">
                ฿{showQRModal === "premium" ? "299" : "599"}
              </p>
              <p className="text-xs text-gray-400">ต่อเดือน</p>
            </div>

            {/* QR Code SVG from API */}
            <div className="flex justify-center mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/payment-qr?tier=${showQRModal}`}
                alt="PromptPay QR Code"
                className="w-48 h-48 border border-gray-200 rounded-2xl bg-white"
              />
            </div>
            <p className="text-xs text-center text-gray-500 mb-4">
              สแกน QR ด้วยแอปธนาคาร → โอนเงิน → อัปโหลดสลิปด้านล่าง
            </p>

            {/* Slip upload */}
            <input
              ref={slipInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSlipFile(f);
                const reader = new FileReader();
                reader.onload = (ev) => setSlipPreview(ev.target?.result as string);
                reader.readAsDataURL(f);
              }}
            />

            {slipPreview ? (
              <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slipPreview} alt="สลิป" className="w-full max-h-40 object-cover" />
                <button
                  onClick={() => { setSlipFile(null); setSlipPreview(""); }}
                  className="absolute top-2 right-2 bg-white rounded-full px-2 py-0.5 text-xs shadow font-medium text-gray-700"
                >
                  เปลี่ยน
                </button>
              </div>
            ) : (
              <button
                onClick={() => slipInputRef.current?.click()}
                className="w-full border-2 border-dashed border-purple-300 rounded-2xl py-4 text-sm text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors mb-3"
              >
                📎 อัปโหลดสลิปการโอนเงิน
              </button>
            )}

            <Button
              disabled={!slipFile || isSubmitting}
              onClick={async () => {
                if (!slipFile) return;
                setIsSubmitting(true);
                try {
                  const form = new FormData();
                  form.append("file", slipFile);
                  form.append("prefix", "slip");
                  const upRes = await fetch("/api/upload-child-photo", { method: "POST", body: form });
                  const upData = await upRes.json();
                  if (!upRes.ok) throw new Error(upData.error || "อัปโหลดสลิปไม่สำเร็จ");

                  const res = await fetch("/api/payment-qr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tier: showQRModal, slipUrl: upData.url }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "ส่งข้อมูลไม่สำเร็จ");
                  if (data.autoApproved) {
                    toast.success(`AI ตรวจสอบผ่าน ✅ เปิดใช้งาน ${showQRModal} แล้ว! อ้างอิง: ${data.ref}`);
                  } else {
                    toast.success(`ส่งสลิปสำเร็จ! 🎉 ทีมงานจะตรวจสอบ อ้างอิง: ${data.ref}`);
                  }
                  setShowQRModal(null);
                  setSlipFile(null);
                  setSlipPreview("");
                  await user?.reload();
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ยืนยันการชำระเงิน
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">
              ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 24 ชั่วโมง
            </p>
          </div>
        </div>
      )}
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
