"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { DIAGNOSIS_OPTIONS } from "@/lib/profile-utils";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const STEPS = ["ข้อมูลผู้ปกครอง", "ข้อมูลลูก", "เสร็จแล้ว!"];

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { childProfile, updateParentProfile, updateChildProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Parent info
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Child info
  const [childName, setChildName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<"ชาย" | "หญิง" | "">("");
  const [diagnosisKey, setDiagnosisKey] = useState("");

  // Redirect if already set up
  useEffect(() => {
    if (isLoaded && isSignedIn && childProfile?.name) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, childProfile, router]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const handleSaveParent = async () => {
    if (!displayName.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    setSaving(true);
    try {
      await updateParentProfile({ displayName: displayName.trim(), phone: phone.trim() || undefined });
      setStep(1);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChild = async () => {
    if (!childName.trim()) { toast.error("กรุณากรอกชื่อลูก"); return; }
    if (!birthdate) { toast.error("กรุณาเลือกวันเกิด"); return; }
    if (!gender) { toast.error("กรุณาเลือกเพศ"); return; }
    if (!diagnosisKey) { toast.error("กรุณาเลือกประเภทพัฒนาการ"); return; }
    const diagnosisLabel = DIAGNOSIS_OPTIONS.find((d) => d.key === diagnosisKey)?.label ?? "";
    setSaving(true);
    try {
      await updateChildProfile({
        name: childName.trim(),
        birthdate,
        gender,
        diagnosisKey,
        diagnosisLabel,
      });
      setStep(2);
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <Image src="/logo.png" alt="KidCoach AI" width={160} height={48} className="h-12 w-auto object-contain" priority />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-purple-700" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 w-full max-w-md">

        {/* Step 0: Parent info */}
        {step === 0 && (
          <div>
            <div className="text-3xl mb-3">👋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">ยินดีต้อนรับ!</h2>
            <p className="text-gray-500 text-sm mb-6">ก่อนเริ่ม ขอทราบข้อมูลผู้ปกครองก่อนนะคะ</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  ชื่อที่อยากให้ AI เรียก <span className="text-red-400">*</span>
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น คุณแม่แนน, คุณพ่อโน้ต"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  เบอร์โทรศัพท์ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812345678"
                  type="tel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveParent}
              disabled={saving}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl py-6 text-base gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              ถัดไป <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Step 1: Child info */}
        {step === 1 && (
          <div>
            <div className="text-3xl mb-3">👶</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">ข้อมูลลูก</h2>
            <p className="text-gray-500 text-sm mb-6">AI จะใช้ข้อมูลนี้เพื่อสร้างแผนฝึกเฉพาะสำหรับลูกคุณค่ะ</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  ชื่อลูก <span className="text-red-400">*</span>
                </label>
                <input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="เช่น น้องนุ่น, น้องเจ"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  วันเกิด <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  เพศ <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["ชาย", "หญิง"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        gender === g
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-600 hover:border-purple-300"
                      }`}
                    >
                      {g === "ชาย" ? "👦 ชาย" : "👧 หญิง"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  ประเภทพัฒนาการที่ต้องการเสริม <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {DIAGNOSIS_OPTIONS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDiagnosisKey(d.key)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        diagnosisKey === d.key
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-600 hover:border-purple-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="gap-1 border-gray-200 text-gray-600"
              >
                <ArrowLeft className="w-4 h-4" /> กลับ
              </Button>
              <Button
                onClick={handleSaveChild}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl py-6 text-base gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                บันทึก <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Done */}
        {step === 2 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">พร้อมแล้ว!</h2>
            <p className="text-gray-500 text-sm mb-2 leading-relaxed">
              บันทึกข้อมูลเรียบร้อยแล้วค่ะ ขั้นตอนแรกที่แนะนำคือ
              <strong className="text-purple-700"> ทำแบบประเมินพัฒนาการ </strong>
              เพื่อให้ AI สร้างแผนฝึกเฉพาะสำหรับ{childName}ค่ะ
            </p>
            <div className="bg-purple-50 rounded-2xl p-4 my-6 text-left space-y-2.5">
              {[
                "ประเมินพัฒนาการ 5 ด้าน (~5 นาที)",
                "AI สร้างแผนฝึกรายวัน 7 วัน",
                "เริ่มฝึกกับลูกได้เลย!",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard/assessment")}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-2xl py-6 text-base gap-2"
              >
                ทำแบบประเมินเลย ✨
              </Button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
              >
                ข้ามไปดู Dashboard ก่อน
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center max-w-sm">
        ข้อมูลของคุณปลอดภัย เราไม่เปิดเผยข้อมูลส่วนบุคคลแก่บุคคลที่สาม
      </p>
    </div>
  );
}
