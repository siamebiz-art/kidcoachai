"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
  Loader2, Check, X, Users, Crown, TrendingUp, Banknote,
  Search, ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

/* ── Types ── */
interface AiSlipCheck {
  valid: boolean; amount: number; amountMatch: boolean;
  bank: string; confidence: "high" | "medium" | "low"; reason: string; checkedAt: string;
}
interface PaymentRecord {
  userId: string; email: string; name: string;
  tier: "premium" | "pro"; amount: number; slipUrl: string;
  ref: string; submittedAt: string;
  status: "pending" | "ai_approved" | "approved" | "rejected";
  rejectedReason?: string; aiCheck?: AiSlipCheck;
}
interface UserRecord {
  userId: string; name: string; email: string;
  tier: string; status: string; joinedAt: string;
  lastActive: string | null; hasPending: boolean;
}
interface Stats {
  totalUsers: number; premium: number; pro: number; free: number;
  revenue: number;
  growth: { month: string; count: number }[];
}

type Tab = "overview" | "users" | "payments";
type PaymentFilter = "all" | "pending" | "ai_approved" | "approved" | "rejected";

/* ── Helpers ── */
const tierColor: Record<string, string> = {
  pro:     "bg-amber-100 text-amber-700 border-amber-200",
  premium: "bg-purple-100 text-purple-700 border-purple-200",
  free:    "bg-gray-100 text-gray-500 border-gray-200",
};
const statusColor: Record<string, string> = {
  approved:    "bg-green-100 text-green-700 border-green-200",
  ai_approved: "bg-green-100 text-green-700 border-green-200",
  pending:     "bg-amber-100 text-amber-700 border-amber-200",
  rejected:    "bg-red-100 text-red-600 border-red-200",
};
const statusLabel: Record<string, string> = {
  approved: "อนุมัติ", ai_approved: "🤖 AI ผ่าน", pending: "รอตรวจ", rejected: "ปฏิเสธ",
};

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "siamebiz@gmail.com";

  const [tab, setTab]               = useState<Tab>("overview");
  const [stats, setStats]           = useState<Stats | null>(null);
  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [payments, setPayments]     = useState<PaymentRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [payFilter, setPayFilter]   = useState<PaymentFilter>("all");
  const [acting, setActing]         = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [slipOpen, setSlipOpen]     = useState<string | null>(null);
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes, pRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/payments"),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (uRes.ok) setUsers((await uRes.json()).users ?? []);
      if (pRes.ok) setPayments((await pRes.json()).payments ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isLoaded) fetchAll(); }, [isLoaded, fetchAll]);

  /* ── Auth guard ── */
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }
  const myEmail = user?.emailAddresses[0]?.emailAddress;
  if (myEmail !== adminEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-2xl">🔒</p>
        <p className="text-gray-600 font-medium">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    );
  }

  /* ── Payment actions ── */
  async function handlePaymentAction(userId: string, action: "approve" | "reject", ref: string) {
    setActing(userId + action);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, action, reason: rejectReason[userId] ?? "" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "เกิดข้อผิดพลาด");
      toast.success(action === "approve" ? `อนุมัติ ${ref} สำเร็จ ✅` : `ปฏิเสธ ${ref} แล้ว`);
      await fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setActing(null);
    }
  }

  /* ── Update tier ── */
  async function handleUpdateTier(targetUserId: string, tier: "free" | "premium" | "pro") {
    setUpdatingTier(targetUserId + tier);
    try {
      const res = await fetch("/api/admin/update-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, tier }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "เกิดข้อผิดพลาด");
      toast.success(`อัปเดต tier เป็น ${tier} แล้ว`);
      await fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setUpdatingTier(null);
    }
  }

  /* ── Derived data ── */
  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) ||
           u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredPayments = payments.filter(
    (p) => payFilter === "all" || p.status === payFilter,
  );
  const pendingCount = payments.filter((p) => p.status === "pending" || p.status === "ai_approved").length;

  /* ── Tabs ── */
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "ภาพรวม" },
    { id: "users",    label: `ผู้ใช้ (${users.length})` },
    { id: "payments", label: `การชำระเงิน${pendingCount > 0 ? ` 🔴${pendingCount}` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kido-point.png" alt="Kido" className="w-9 h-9 object-contain" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">KidCoach Admin</h1>
          </div>
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "ผู้ใช้ทั้งหมด", value: stats.totalUsers, icon: Users,     color: "text-blue-600",   bg: "bg-blue-50" },
                { label: "Premium",        value: stats.premium,    icon: Crown,     color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Pro",            value: stats.pro,        icon: Crown,     color: "text-amber-600",  bg: "bg-amber-50" },
                { label: "รายได้/เดือน",  value: `฿${stats.revenue.toLocaleString()}`, icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
              ].map((s) => (
                <Card key={s.label} className="p-5 border-gray-100 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Growth chart (simple bar) */}
            {stats.growth.length > 0 && (
              <Card className="p-6 border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <h2 className="font-semibold text-gray-900 text-sm">User Growth (6 เดือนล่าสุด)</h2>
                </div>
                <div className="flex items-end gap-3 h-32">
                  {(() => {
                    const max = Math.max(...stats.growth.map((g) => g.count), 1);
                    return stats.growth.map((g) => (
                      <div key={g.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-700">{g.count}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-500 transition-all"
                          style={{ height: `${Math.max((g.count / max) * 100, 8)}%` }}
                        />
                        <span className="text-xs text-gray-400">{g.month.slice(5)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            )}

            {/* Quick summary */}
            <Card className="p-5 border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">สัดส่วนผู้ใช้</h2>
              <div className="space-y-2">
                {[
                  { label: "Free",    count: stats.free,    total: stats.totalUsers, color: "bg-gray-300" },
                  { label: "Premium", count: stats.premium, total: stats.totalUsers, color: "bg-purple-500" },
                  { label: "Pro",     count: stats.pro,     total: stats.totalUsers, color: "bg-amber-400" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-16">{r.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${r.color} rounded-full transition-all`}
                        style={{ width: `${r.total ? (r.count / r.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-6 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <Card className="border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["ชื่อ / อีเมล", "Tier", "สมัครเมื่อ", "เปลี่ยน Tier"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-10 text-gray-400">ไม่พบผู้ใช้</td></tr>
                    )}
                    {filteredUsers.map((u) => (
                      <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          {u.hasPending && <span className="text-xs text-amber-600">⏳ มีสลิปรอตรวจ</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${tierColor[u.tier] ?? tierColor.free}`}>
                            {u.tier.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(u.joinedAt).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <select
                              defaultValue={u.tier}
                              disabled={updatingTier !== null}
                              onChange={(e) => handleUpdateTier(u.userId, e.target.value as "free" | "premium" | "pro")}
                              className="appearance-none text-xs border border-gray-200 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white cursor-pointer disabled:opacity-50"
                            >
                              <option value="free">Free</option>
                              <option value="premium">Premium</option>
                              <option value="pro">Pro</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {tab === "payments" && (
          <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "ai_approved", "approved", "rejected"] as PaymentFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setPayFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    payFilter === f
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "ทั้งหมด" : statusLabel[f]}
                  {" "}({payments.filter((p) => f === "all" || p.status === f).length})
                </button>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <Card className="p-10 text-center border-gray-100 shadow-sm">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-400 text-sm">ไม่มีรายการ</p>
              </Card>
            )}

            <div className="space-y-3">
              {filteredPayments.map((p) => {
                const isPending = p.status === "pending" || p.status === "ai_approved";
                return (
                  <Card key={p.userId + p.ref} className={`p-5 shadow-sm ${isPending ? "border-amber-200" : "border-gray-100"}`}>
                    <div className="flex flex-wrap gap-4 items-start">
                      <div
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                        onClick={() => setSlipOpen(p.slipUrl)}
                      >
                        <Image src={p.slipUrl} alt="slip" fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`text-xs ${tierColor[p.tier]}`}>{p.tier.toUpperCase()}</Badge>
                          <span className="font-bold text-gray-900">฿{p.amount}</span>
                          <Badge className={`text-xs ${statusColor[p.status]}`}>{statusLabel[p.status]}</Badge>
                          <span className="text-xs text-gray-400 ml-auto">{p.ref}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(p.submittedAt).toLocaleString("th-TH")}</p>
                        {p.aiCheck && (
                          <div className={`mt-2 rounded-xl px-3 py-2 text-xs ${
                            p.aiCheck.valid && p.aiCheck.amountMatch ? "bg-green-50 text-green-800" :
                            !p.aiCheck.valid ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"
                          }`}>
                            🤖 {p.aiCheck.bank} · ฿{p.aiCheck.amount} ·{" "}
                            {p.aiCheck.amountMatch ? "✅ ยอดตรง" : "⚠️ ยอดไม่ตรง"} · {p.aiCheck.confidence}
                            <br /><span className="text-gray-500">{p.aiCheck.reason}</span>
                          </div>
                        )}
                        {p.rejectedReason && (
                          <p className="text-xs text-red-500 mt-1">เหตุผล: {p.rejectedReason}</p>
                        )}
                      </div>
                    </div>

                    {isPending && (
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
                            onClick={() => handlePaymentAction(p.userId, "approve", p.ref)}
                            disabled={acting !== null}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl gap-2"
                          >
                            {acting === p.userId + "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            อนุมัติ
                          </Button>
                          <Button
                            onClick={() => handlePaymentAction(p.userId, "reject", p.ref)}
                            disabled={acting !== null}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl gap-2"
                          >
                            {acting === p.userId + "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            ปฏิเสธ
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slip lightbox */}
      {slipOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSlipOpen(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <Image src={slipOpen} alt="สลิป" width={500} height={700} className="rounded-2xl w-full h-auto" />
            <button onClick={() => setSlipOpen(null)} className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
