"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Loader2, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface PaymentRecord {
  userId: string;
  email: string;
  name: string;
  tier: "premium" | "pro";
  amount: number;
  slipUrl: string;
  ref: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string;
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [slipOpen, setSlipOpen] = useState<string | null>(null);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  async function fetchPayments() {
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) return;
      const data = await res.json();
      setPayments(data.payments ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded) fetchPayments();
  }, [isLoaded]);

  async function handleAction(userId: string, action: "approve" | "reject", ref: string) {
    setActing(userId + action);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, action, reason: rejectReason[userId] ?? "" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "เกิดข้อผิดพลาด");
      }
      toast.success(action === "approve" ? `อนุมัติ ${ref} สำเร็จ ✅` : `ปฏิเสธ ${ref} แล้ว`);
      await fetchPayments();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setActing(null);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const myEmail = user?.emailAddresses[0]?.emailAddress;
  if (myEmail !== (adminEmail ?? "siamebiz@gmail.com") && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-2xl">🔒</p>
        <p className="text-gray-600 font-medium">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  const pending  = payments.filter((p) => p.status === "pending");
  const resolved = payments.filter((p) => p.status !== "pending");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin — PromptPay Payments</h1>
            <p className="text-sm text-gray-400">ตรวจสอบและอนุมัติสลิปการชำระเงิน</p>
          </div>
        </div>

        {pending.length === 0 && resolved.length === 0 && (
          <Card className="p-10 text-center border-gray-100 shadow-sm">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-gray-500">ยังไม่มีรายการชำระเงิน</p>
          </Card>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
              รอตรวจสอบ ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((p) => (
                <Card key={p.userId} className="p-5 border-amber-200 shadow-sm">
                  <div className="flex flex-wrap gap-4 items-start">
                    {/* Slip thumbnail */}
                    <div
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                      onClick={() => setSlipOpen(p.slipUrl)}
                    >
                      <Image src={p.slipUrl} alt="slip" fill className="object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={p.tier === "pro" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-purple-100 text-purple-700 border-purple-200"}>
                          {p.tier.toUpperCase()}
                        </Badge>
                        <span className="font-bold text-gray-900">฿{p.amount}</span>
                        <span className="text-xs text-gray-400 ml-auto">{p.ref}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(p.submittedAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>

                  {/* Reject reason input */}
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="เหตุผลในการปฏิเสธ (ถ้ามี)"
                      value={rejectReason[p.userId] ?? ""}
                      onChange={(e) => setRejectReason((prev) => ({ ...prev, [p.userId]: e.target.value }))}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction(p.userId, "approve", p.ref)}
                        disabled={acting !== null}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl gap-2"
                      >
                        {acting === p.userId + "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        อนุมัติ
                      </Button>
                      <Button
                        onClick={() => handleAction(p.userId, "reject", p.ref)}
                        disabled={acting !== null}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl gap-2"
                      >
                        {acting === p.userId + "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        ปฏิเสธ
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">ประวัติ ({resolved.length})</h2>
            <div className="space-y-3">
              {resolved.map((p) => (
                <Card key={p.userId + p.ref} className="p-4 border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 cursor-pointer shrink-0 hover:opacity-80"
                      onClick={() => setSlipOpen(p.slipUrl)}
                    >
                      <Image src={p.slipUrl} alt="slip" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name} — {p.email}</p>
                      <p className="text-xs text-gray-500">{p.ref} · {p.tier} · ฿{p.amount}</p>
                    </div>
                    <Badge className={p.status === "approved" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}>
                      {p.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Slip lightbox */}
      {slipOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSlipOpen(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <Image src={slipOpen} alt="สลิปการโอน" width={500} height={700} className="rounded-2xl w-full h-auto" />
            <button
              onClick={() => setSlipOpen(null)}
              className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg text-gray-700 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
