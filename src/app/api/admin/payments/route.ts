import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/* ── GET /api/admin/payments — list users with pending PromptPay payments ── */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const myEmail = me.emailAddresses[0]?.emailAddress;
  if (myEmail !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = await client.users.getUserList({ limit: 200 });
  const pending = response.data
    .filter((u) => (u.unsafeMetadata as Record<string, unknown>).pendingPayment)
    .map((u) => {
      const pp = (u.unsafeMetadata as Record<string, unknown>).pendingPayment as Record<string, unknown>;
      return {
        userId:      u.id,
        email:       u.emailAddresses[0]?.emailAddress ?? "",
        name:        u.firstName ? `${u.firstName} ${u.lastName ?? ""}`.trim() : "ไม่ระบุ",
        tier:        pp.tier,
        amount:      pp.amount,
        slipUrl:     pp.slipUrl,
        ref:         pp.ref,
        submittedAt: pp.submittedAt,
        status:      pp.status,
        rejectedReason: pp.rejectedReason ?? "",
        aiCheck:     pp.aiCheck ?? null,
      };
    });

  return NextResponse.json({ payments: pending });
}
